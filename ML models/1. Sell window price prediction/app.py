"""
FastAPI backend for the price forecasting + sale-window recommendation model.

WHAT THIS DOES:
Wraps the LocalPricePredictor (from 3_local_price_predictor.py) in a web API,
so your backend teammate can call it over HTTP instead of importing Python
code directly — this is exactly what they need to build the rest of the
backend (their server can call this API, or this logic can later be merged
directly into their FastAPI app as another router).

HOW TO RUN:
1. Make sure these files are in the SAME folder as this app.py:
     - price_model.pkl
     - district_offsets.csv
     - grade_offsets.csv
     - aggregated_prices.csv
     - 3_local_price_predictor.py   (the LocalPricePredictor class)
2. Install dependencies:
     p
3. Run:
     uvicorn app:app --reload
4. It will print a local URL, typically:
     http://127.0.0.1:8000
5. Interactive API docs (auto-generated, very useful for your backend
   teammate to explore and test the endpoint by hand) are at:
     http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import importlib.util
import os

# ---- Load the LocalPricePredictor class from 3_local_price_predictor.py ----
_module_path = os.path.join(os.path.dirname(__file__), "3_local_price_predictor.py")
_spec = importlib.util.spec_from_file_location("local_price_predictor", _module_path)
_predictor_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_predictor_module)

LocalPricePredictor = _predictor_module.LocalPricePredictor
sale_window_recommendation = _predictor_module.sale_window_recommendation

app = FastAPI(
    title="Mandi Price Prediction API",
    description="Predicts local, grade-specific crop prices and gives sell-now-vs-wait advice.",
    version="1.0.0",
)

# ---- Load model + data ONCE at startup (not on every request — that would be slow) ----
predictor = None
history_df = None


@app.on_event("startup")
def load_model():
    global predictor, history_df
    predictor = LocalPricePredictor()
    history_df = pd.read_csv("aggregated_prices.csv", parse_dates=["Arrival_Date"])
    print("Model and data loaded successfully.")


# ---- Response shape, so the API docs show exactly what fields to expect ----
class PricePredictionResponse(BaseModel):
    commodity: str
    state: str
    district: Optional[str]
    grade: Optional[str]
    state_predicted_price: float
    district_offset: float
    grade_offset: float
    local_predicted_price: float
    today_actual_price: float
    recommendation: str


@app.get("/")
def root():
    return {"message": "Mandi Price Prediction API is running. See /docs for usage."}


@app.get("/health")
def health_check():
    """Simple check your backend teammate can call to confirm the API is up."""
    return {"status": "ok", "model_loaded": predictor is not None}


@app.get("/predict-price", response_model=PricePredictionResponse)
def predict_price(
    commodity: str = Query(..., description="e.g. Onion, Wheat, Tomato, Potato, Rice"),
    state: str = Query(..., description="e.g. Maharashtra, Uttar Pradesh"),
    district: Optional[str] = Query(None, description="Optional — e.g. Nashik"),
    grade: Optional[str] = Query(None, description="Optional — e.g. Grade A, FAQ"),
):
    """
    Predicts the price for a commodity+state (optionally refined by
    district/grade), and returns a sell-now-vs-wait recommendation.
    """
    subset = history_df[
        (history_df["Commodity"] == commodity) & (history_df["State"] == state)
    ]

    if len(subset) < 31:
        raise HTTPException(
            status_code=404,
            detail=f"Not enough price history for {commodity} in {state} "
                    f"(found {len(subset)} days, need at least 31). "
                    f"Check spelling, or this combination may not be in the data.",
        )

    try:
        features_today = predictor.build_features_for_prediction(commodity, state, subset)
        state_prediction = float(predictor.model.predict(features_today)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    result = predictor.predict_local_price(
        state_predicted_price=state_prediction,
        commodity=commodity,
        state=state,
        district=district,
        grade=grade,
    )

    today_actual_price = float(subset.sort_values("Arrival_Date")["Modal_Price"].iloc[-1])
    advice = sale_window_recommendation(today_actual_price, result["local_predicted_price"])

    return PricePredictionResponse(
        commodity=commodity,
        state=state,
        district=district,
        grade=grade,
        state_predicted_price=result["state_predicted_price"],
        district_offset=result["district_offset"],
        grade_offset=result["grade_offset"],
        local_predicted_price=result["local_predicted_price"],
        today_actual_price=today_actual_price,
        recommendation=advice,
    )
