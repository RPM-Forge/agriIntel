"""
Buyer-Lot Matching — MVP version.

IMPORTANT: This is NOT a supervised ML model, and deliberately so. Unlike
price forecasting (where 3 years of real government price data existed to
learn from), a new marketplace has ZERO historical "which buyer picked which
lot" data to train on — this is the classic cold-start problem. Training an
ML model here would mean training on data that doesn't exist.

Instead, this is a transparent, tunable SCORING algorithm — every match
comes with a breakdown of why it scored what it did, which is also easier
to explain to judges than a black-box model. Once the real app has collected
enough actual transaction history (accepted/rejected offers), a learned
ranking model could be introduced later as a v2 upgrade — noted at the
bottom of this file.

MATCHING FACTORS (weighted, each normalized to 0-1):
  - Crop match       : HARD FILTER — a buyer is only considered if their
                        crop requirement exactly matches the lot's crop.
  - Quality grade fit : how close the lot's grade is to what the buyer wants
  - Quantity fit      : does the lot's quantity fall in the buyer's needed range
  - Price fit         : is the lot's asking price within the buyer's budget
  - Location proximity: same district > same state > different state
                         (or real distance, if lat/lon is available)
  - Buyer reliability : verified status + past rating, if any
"""

import pandas as pd
import numpy as np

# ============ CONFIG ============
# Weights must sum to 1.0 — tune these based on what your team decides
# matters most (e.g. increase 'location' weight if logistics cost is a big
# pain point for your target region).
WEIGHTS = {
    "quality": 0.25,
    "quantity": 0.20,
    "price": 0.20,
    "location": 0.20,
    "reliability": 0.15,
}

# Ordinal ranking of grades, low to high. Extend this if your data has more
# grade labels. Grades not in this list get a neutral middle rank.
GRADE_RANK = {
    "Grade C": 1,
    "Grade B": 2,
    "FAQ": 2,       # Fair Average Quality — treated as a mid-tier grade
    "Grade A": 3,
}
DEFAULT_GRADE_RANK = 2
MAX_GRADE_RANK_DIFF = 2  # max possible difference given the ranks above
# =================================


def _quality_score(lot_grade, buyer_grade):
    """1.0 for an exact grade match, tapering off the further apart they are."""
    lot_rank = GRADE_RANK.get(lot_grade, DEFAULT_GRADE_RANK)
    buyer_rank = GRADE_RANK.get(buyer_grade, DEFAULT_GRADE_RANK)
    diff = abs(lot_rank - buyer_rank)
    return max(0.0, 1 - diff / MAX_GRADE_RANK_DIFF)


def _quantity_score(lot_qty, buyer_min_qty, buyer_max_qty):
    """
    1.0 if the lot's quantity falls within what the buyer needs.
    Partial credit if the lot is smaller than the buyer's minimum (it could
    still be combined with other lots via an FPO) or larger than their max
    (they could still take a partial fulfillment).
    """
    if buyer_min_qty <= lot_qty <= buyer_max_qty:
        return 1.0
    if lot_qty < buyer_min_qty:
        return max(0.0, lot_qty / buyer_min_qty) if buyer_min_qty > 0 else 0.0
    # lot_qty > buyer_max_qty
    return max(0.0, buyer_max_qty / lot_qty) if lot_qty > 0 else 0.0


def _price_score(lot_asking_price, buyer_max_price):
    """1.0 if the lot's price is within the buyer's budget, else tapers down."""
    if lot_asking_price <= buyer_max_price:
        return 1.0
    return max(0.0, buyer_max_price / lot_asking_price) if lot_asking_price > 0 else 0.0


def _location_score(lot_state, lot_district, buyer_state, buyer_district):
    """Simple tiered proximity score. Swap in real lat/lon distance later if available."""
    if lot_state == buyer_state and lot_district == buyer_district:
        return 1.0
    if lot_state == buyer_state:
        return 0.6
    return 0.2


def _reliability_score(buyer_verified, buyer_rating):
    """
    buyer_rating: 0-5 scale, or None/NaN if the buyer has no rating yet
    (e.g. a brand-new buyer on the platform).
    """
    if pd.notna(buyer_rating):
        return max(0.0, min(1.0, buyer_rating / 5.0))
    return 0.8 if buyer_verified else 0.5  # neutral defaults for unrated buyers


def score_match(lot, buyer, weights=WEIGHTS):
    """
    Score one (lot, buyer) pair. Returns None if the crop doesn't match
    (hard filter — no partial credit for wrong crop).
    Otherwise returns a dict with the overall score and its breakdown.
    """
    if lot["crop_type"] != buyer["crop_type"]:
        return None

    scores = {
        "quality": _quality_score(lot["quality_grade"], buyer["required_grade"]),
        "quantity": _quantity_score(lot["quantity_kg"], buyer["min_qty_kg"], buyer["max_qty_kg"]),
        "price": _price_score(lot["asking_price"], buyer["max_price"]),
        "location": _location_score(lot["state"], lot["district"], buyer["state"], buyer["district"]),
        "reliability": _reliability_score(buyer["verified"], buyer.get("rating", np.nan)),
    }

    overall = sum(scores[k] * weights[k] for k in weights)

    return {
        "buyer_id": buyer["buyer_id"],
        "buyer_name": buyer["buyer_name"],
        "overall_score": round(overall, 4),
        **{f"{k}_score": round(v, 4) for k, v in scores.items()},
    }


def rank_buyers_for_lot(lot, buyers_df, weights=WEIGHTS, top_n=5):
    """
    Given one lot and a DataFrame of all buyers, return the top_n best-matching
    verified buyers, ranked by overall_score (highest first).
    """
    matches = []
    for _, buyer in buyers_df.iterrows():
        result = score_match(lot, buyer, weights)
        if result is not None:
            matches.append(result)

    if not matches:
        return pd.DataFrame(columns=[
            "buyer_id", "buyer_name", "overall_score",
            "quality_score", "quantity_score", "price_score",
            "location_score", "reliability_score",
        ])

    result_df = pd.DataFrame(matches).sort_values("overall_score", ascending=False)
    return result_df.head(top_n).reset_index(drop=True)


if __name__ == "__main__":
    # ---- Example usage with sample data ----
    sample_lot = {
        "lot_id": "L001",
        "crop_type": "Onion",
        "quantity_kg": 500,
        "quality_grade": "Grade A",
        "state": "Maharashtra",
        "district": "Nashik",
        "asking_price": 2200,
    }

    sample_buyers = pd.DataFrame([
        {"buyer_id": "B1", "buyer_name": "Fresh Foods Processing", "crop_type": "Onion",
         "required_grade": "Grade A", "min_qty_kg": 300, "max_qty_kg": 1000,
         "max_price": 2300, "state": "Maharashtra", "district": "Nashik",
         "verified": True, "rating": 4.5},
        {"buyer_id": "B2", "buyer_name": "Regional Trader Co", "crop_type": "Onion",
         "required_grade": "FAQ", "min_qty_kg": 1000, "max_qty_kg": 5000,
         "max_price": 2000, "state": "Maharashtra", "district": "Pune",
         "verified": True, "rating": 3.8},
        {"buyer_id": "B3", "buyer_name": "Distant Exporter Ltd", "crop_type": "Onion",
         "required_grade": "Grade A", "min_qty_kg": 400, "max_qty_kg": 800,
         "max_price": 2500, "state": "Gujarat", "district": "Surat",
         "verified": False, "rating": np.nan},
        {"buyer_id": "B4", "buyer_name": "Wheat Only Buyer", "crop_type": "Wheat",
         "required_grade": "FAQ", "min_qty_kg": 500, "max_qty_kg": 2000,
         "max_price": 2500, "state": "Maharashtra", "district": "Nashik",
         "verified": True, "rating": 4.0},
    ])

    top_matches = rank_buyers_for_lot(sample_lot, sample_buyers)
    print("Top matches for lot L001 (500kg Grade A Onion, Nashik, asking ₹2200):")
    print(top_matches.to_string(index=False))
