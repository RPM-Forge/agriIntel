"""
Step 3: Combine the state-level model prediction with district/grade offsets
to produce a LOCAL, grade-specific price, and turn that into a
sell-now-vs-wait recommendation.

This is what your app's backend actually calls when a farmer opens the app
and picks their crop + state + district + grade.
"""

import pandas as pd
import joblib

# ============ CONFIG ============
MODEL_FILE = "price_model.pkl"
DISTRICT_OFFSETS_CSV = "district_offsets.csv"
GRADE_OFFSETS_CSV = "grade_offsets.csv"
FORECAST_DAYS_AHEAD = 7
# =================================


class LocalPricePredictor:
    def __init__(self):
        saved = joblib.load(MODEL_FILE)
        self.model = saved["model"]
        self.feature_cols = saved["feature_cols"]
        self.district_offsets = pd.read_csv(DISTRICT_OFFSETS_CSV)
        self.grade_offsets = pd.read_csv(GRADE_OFFSETS_CSV)

    def _lookup_offset(self, offsets_df, commodity, state, group_col, group_value):
        """
        Look up a historical offset ratio. Returns 1.0 (i.e. no adjustment)
        if we don't have reliable data for this combination — this is a
        deliberate safe fallback so a missing/new district or grade never
        crashes the app or silently returns a wrong number, it just skips
        that adjustment.
        """
        if group_value is None:
            return 1.0

        match = offsets_df[
            (offsets_df["Commodity"] == commodity)
            & (offsets_df["State"] == state)
            & (offsets_df[group_col] == group_value)
        ]

        if len(match) == 0:
            return 1.0  # no reliable historical data for this combo — no adjustment

        return float(match.iloc[0]["offset_ratio"])

    def predict_local_price(self, state_predicted_price, commodity, state, district=None, grade=None):
        """
        Applies district and grade offsets multiplicatively on top of the
        state-level model prediction.
        """
        district_offset = self._lookup_offset(
            self.district_offsets, commodity, state, "District", district
        )
        grade_offset = self._lookup_offset(
            self.grade_offsets, commodity, state, "Grade", grade
        )

        # Offsets are ratios relative to the state average (each computed
        # independently against the state baseline), so we apply them as
        # independent multiplicative corrections on top of the state prediction.
        adjusted_price = state_predicted_price * district_offset * grade_offset

        return {
            "state_predicted_price": round(state_predicted_price, 2),
            "district_offset": round(district_offset, 4),
            "grade_offset": round(grade_offset, 4),
            "local_predicted_price": round(adjusted_price, 2),
        }

    def build_features_for_prediction(self, commodity, state, recent_prices_df):
        """
        Build the feature row needed to call model.predict() for "today",
        using the most recent known prices for this commodity+state.

        recent_prices_df: DataFrame with columns [Arrival_Date, Modal_Price],
        sorted ascending by date, containing at least the last 30 days
        of state-level prices (i.e. the aggregated_prices.csv rows for
        this commodity+state).
        """
        recent_prices_df = recent_prices_df.sort_values("Arrival_Date")
        prices = recent_prices_df["Modal_Price"].values
        last_date = recent_prices_df["Arrival_Date"].max()

        # "Today" = prices[-1] (the most recent known price, dated last_date).
        # We need 30 days of history BEFORE today for lag_30, so 31 total.
        if len(prices) < 31:
            raise ValueError(
                f"Need at least 31 days of recent price history to build features "
                f"(30 days of lag history + today), got {len(prices)}."
            )

        # IMPORTANT: these indices must mirror build_features() in
        # 2_train_price_model.py EXACTLY, or the model will silently see
        # different features at prediction time than it was trained on.
        # There, for a row dated D: current_price = price(D), lag_1 = price(D-1)
        # (via shift(1)), lag_7 = price(D-7), roll_avg_7 = mean of price(D-7..D-1).
        # Here, D = last_date = "today", so:
        row = {
            "current_price": prices[-1],           # price(today)
            "lag_1": prices[-2],                    # price(today - 1)
            "lag_7": prices[-8],                    # price(today - 7)
            "lag_14": prices[-15],                  # price(today - 14)
            "lag_30": prices[-31],                  # price(today - 30)
            "roll_avg_7": prices[-8:-1].mean(),     # mean of (today-7 .. today-1), excludes today itself
            "roll_avg_30": prices[-31:-1].mean(),   # mean of (today-30 .. today-1), excludes today itself
            "day_of_week": pd.Timestamp(last_date).dayofweek,
            "month": pd.Timestamp(last_date).month,
        }

        # Fill in one-hot crop/state columns, defaulting everything to 0
        # then setting this commodity/state to 1 — matches how training
        # data was encoded. Any dummy column not in feature_cols is ignored.
        for col in self.feature_cols:
            if col.startswith("crop_"):
                row[col] = 1 if col == f"crop_{commodity}" else 0
            elif col.startswith("state_"):
                row[col] = 1 if col == f"state_{state}" else 0

        # Ensure column order matches training exactly
        feature_row = pd.DataFrame([row])[self.feature_cols]
        return feature_row


def sale_window_recommendation(current_price, predicted_price, forecast_days=FORECAST_DAYS_AHEAD, threshold_pct=5):
    """
    Compares today's actual local price to the predicted local price and
    gives simple sell-now-vs-wait advice.
    """
    if current_price <= 0:
        raise ValueError("current_price must be positive")

    change_pct = (predicted_price - current_price) / current_price * 100

    if change_pct >= threshold_pct:
        return f"WAIT — price expected to rise ~{change_pct:.1f}% in {forecast_days} days"
    elif change_pct <= -threshold_pct:
        return f"SELL NOW — price expected to drop ~{abs(change_pct):.1f}% in {forecast_days} days"
    else:
        return "SELL NOW — price expected to stay roughly stable, no strong reason to wait"


if __name__ == "__main__":
    # ---- Example usage ----
    predictor = LocalPricePredictor()

    # Load recent state-level history for Onion in Uttar Pradesh
    history = pd.read_csv("aggregated_prices.csv", parse_dates=["Arrival_Date"])
    history = history[(history["Commodity"] == "Onion") & (history["State"] == "Uttar Pradesh")]

    features_today = predictor.build_features_for_prediction("Onion", "Uttar Pradesh", history)
    state_prediction = predictor.model.predict(features_today)[0]

    result = predictor.predict_local_price(
        state_predicted_price=state_prediction,
        commodity="Onion",
        state="Uttar Pradesh",
        district="Auraiya",
        grade="Grade A",
    )
    print("Prediction breakdown:", result)

    today_local_price = history["Modal_Price"].iloc[-1]  # placeholder: today's actual local price
    advice = sale_window_recommendation(today_local_price, result["local_predicted_price"])
    print("Advice:", advice)
