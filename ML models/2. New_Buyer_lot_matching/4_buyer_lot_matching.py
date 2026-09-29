"""
Buyer-Lot Matching — MVP version, with REAL distance-based location scoring.

IMPORTANT: This is NOT a supervised ML model, and deliberately so — there's
no historical "which buyer picked which lot" data to train on yet (cold-start
problem for a new marketplace). Instead, this is a transparent, tunable
SCORING algorithm.

LOCATION SCORING (updated): uses the haversine formula on real lat/lon
coordinates (via district_coords.py) instead of a crude "same state /
different state" tier. This matters because PS 26132 explicitly calls for
connecting farmers to NEARBY buyers to reduce logistics/transport cost — a
tiered same-state score treated a buyer 50km away the same as one 400km
away in the same state, and could let a distant buyer with a slightly
better price win over a genuinely nearby one. Distance now decays smoothly:
full score within ~0km, zero score at MAX_DISTANCE_KM or beyond.

MATCHING FACTORS (weighted, each normalized to 0-1):
  - Crop match       : HARD FILTER
  - Location proximity: real distance in km (35% weight — highest, per PS)
  - Quality grade fit : how close the lot's grade is to what the buyer wants
  - Quantity fit      : does the lot's quantity fall in the buyer's needed range
  - Price fit         : is the lot's asking price within the buyer's budget
  - Buyer reliability : verified status + past rating, if any
"""

import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2
from district_coords import DISTRICT_COORDS

# ============ CONFIG ============
# Weights must sum to 1.0. Location is now the largest factor, reflecting
# PS 26132's explicit emphasis on nearby buyers / reduced transport cost.
WEIGHTS = {
    "price": 0.30,
    "location": 0.25,
    "quality": 0.20,
    "quantity": 0.15,
    "reliability": 0.10,
}

GRADE_RANK = {
    "Grade C": 1,
    "Grade B": 2,
    "FAQ": 2,
    "Grade A": 3,
}
DEFAULT_GRADE_RANK = 2
MAX_GRADE_RANK_DIFF = 2

# Distance (km) beyond which location score bottoms out at 0. 300km is
# roughly the scale of a mid-size Indian state — same-state matches usually
# score well, cross-state matches usually score poorly, without hardcoding
# state boundaries (a nearby district in a neighboring state still scores
# reasonably, which is realistic).
MAX_DISTANCE_KM = 300
# =================================


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon points, in kilometers."""
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def get_coords(state, district):
    """Look up lat/lon for a state+district. Returns None if not in our table."""
    return DISTRICT_COORDS.get((state, district))


def _quality_score(lot_grade, buyer_grade):
    lot_rank = GRADE_RANK.get(lot_grade, DEFAULT_GRADE_RANK)
    buyer_rank = GRADE_RANK.get(buyer_grade, DEFAULT_GRADE_RANK)
    diff = abs(lot_rank - buyer_rank)
    return max(0.0, 1 - diff / MAX_GRADE_RANK_DIFF)


def _quantity_score(lot_qty, buyer_min_qty, buyer_max_qty):
    if buyer_min_qty <= lot_qty <= buyer_max_qty:
        return 1.0
    if lot_qty < buyer_min_qty:
        return max(0.0, lot_qty / buyer_min_qty) if buyer_min_qty > 0 else 0.0
    return max(0.0, buyer_max_qty / lot_qty) if lot_qty > 0 else 0.0


def _price_score(lot_asking_price, buyer_max_price):
    """
    1.0 if the lot's price is within the buyer's budget. Otherwise the ratio
    is SQUARED (not linear) — a buyer offering half the asking price should
    be penalized much more than half credit, since a big price gap usually
    means the deal just won't happen in practice.
    """
    if lot_asking_price <= buyer_max_price:
        return 1.0
    if lot_asking_price <= 0:
        return 0.0
    ratio = buyer_max_price / lot_asking_price
    return max(0.0, ratio ** 2)


def _location_score(lot_state, lot_district, buyer_state, buyer_district):
    """
    Real distance-based proximity score using haversine distance.
    1.0 at 0km, decaying linearly to 0.0 at MAX_DISTANCE_KM or beyond.
    Falls back to a coarse same-state=0.5 / different-state=0.1 guess if
    either location isn't in our coordinate table (better than crashing).
    """
    lot_coords = get_coords(lot_state, lot_district)
    buyer_coords = get_coords(buyer_state, buyer_district)

    if lot_coords is None or buyer_coords is None:
        return 0.5 if lot_state == buyer_state else 0.1

    dist_km = haversine_km(lot_coords[0], lot_coords[1], buyer_coords[0], buyer_coords[1])
    return max(0.0, 1 - dist_km / MAX_DISTANCE_KM)


def _reliability_score(buyer_verified, buyer_rating):
    if pd.notna(buyer_rating):
        return max(0.0, min(1.0, buyer_rating / 5.0))
    return 0.8 if buyer_verified else 0.5


def score_match(lot, buyer, weights=WEIGHTS):
    if lot["crop_type"] != buyer["crop_type"]:
        return None

    # PS 26132 explicitly requires matching farmers/FPOs with VERIFIED buyers
    # only — this is a hard filter, not just a soft reliability factor.
    if not bool(buyer["verified"]):
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


def suggest_aggregation_group(lot, buyer, all_lots_df, max_group_size=10):
    required_qty = buyer["min_qty_kg"]

    if lot["quantity_kg"] >= required_qty:
        return {
            "aggregation_needed": False,
            "message": "This lot alone already meets the buyer's minimum quantity.",
        }

    candidates = all_lots_df[
        (all_lots_df["crop_type"] == lot["crop_type"])
        & (all_lots_df["status"] == "available")
        & (all_lots_df["lot_id"] != lot["lot_id"])
        & (all_lots_df["farmer_id"] != lot["farmer_id"])
    ].copy()

    if len(candidates) == 0:
        return {
            "aggregation_needed": True,
            "target_met": False,
            "total_quantity_kg": lot["quantity_kg"],
            "still_short_by_kg": required_qty - lot["quantity_kg"],
            "group": [],
            "message": "No other available farmers found for this crop right now.",
        }

    candidates["quality_compat"] = candidates["quality_grade"].apply(
        lambda g: _quality_score(g, lot["quality_grade"])
    )
    candidates["proximity"] = candidates.apply(
        lambda r: _location_score(lot["state"], lot["district"], r["state"], r["district"]),
        axis=1,
    )
    candidates["buyer_fit"] = candidates["quality_grade"].apply(
        lambda g: _quality_score(g, buyer["required_grade"])
    )
    candidates = candidates[candidates["buyer_fit"] >= 0.5]

    candidates["rank_score"] = 0.5 * candidates["proximity"] + 0.5 * candidates["quality_compat"]
    candidates = candidates.sort_values("rank_score", ascending=False)

    group = []
    total_qty = lot["quantity_kg"]

    for _, cand in candidates.iterrows():
        if total_qty >= required_qty or len(group) >= max_group_size:
            break
        group.append({
            "farmer_id": cand["farmer_id"],
            "lot_id": cand["lot_id"],
            "quantity_kg": cand["quantity_kg"],
            "quality_grade": cand["quality_grade"],
            "state": cand["state"],
            "district": cand["district"],
            "proximity_score": round(cand["proximity"], 2),
        })
        total_qty += cand["quantity_kg"]

    target_met = total_qty >= required_qty

    return {
        "aggregation_needed": True,
        "target_met": target_met,
        "total_quantity_kg": total_qty,
        "still_short_by_kg": max(0, required_qty - total_qty),
        "group": group,
        "message": (
            f"Combine with {len(group)} other farmer(s) to reach {total_qty}kg "
            f"(buyer needs {required_qty}kg)."
            if target_met else
            f"Even combining with all {len(group)} available nearby farmer(s), "
            f"only {total_qty}kg reached — still short of the {required_qty}kg needed."
        ),
    }


# ============================================================
# REGISTERED FPO PRIORITY AGGREGATION
# ============================================================
# If a farmer belongs to a real, pre-existing FPO, we prefer pooling with
# their OWN FPO's other members first — this is more trustworthy and
# operationally simpler (existing relationships, shared logistics) than
# grouping with random independent farmers. Only if the FPO's own pool
# still isn't enough do we top up with the ad-hoc nearby-farmer fallback.

def suggest_aggregation_group_v2(lot, buyer, all_lots_df, fpo_registry_df=None, max_group_size=10):
    """
    Same contract as suggest_aggregation_group(), but FPO-aware.

    If lot has a non-empty 'fpo_id':
      1. Pool with other AVAILABLE lots from the SAME fpo_id first.
      2. If that alone meets the buyer's minimum -> done, source = "registered_fpo".
      3. If not enough -> top up with the existing ad-hoc nearby-farmer
         logic, and label each contributor by its actual source so the
         farmer can see which is which.

    If lot has no fpo_id (independent farmer) -> behaves exactly like the
    original suggest_aggregation_group() (no behavior change for them).
    """
    required_qty = buyer["min_qty_kg"]

    if lot["quantity_kg"] >= required_qty:
        return {"aggregation_needed": False,
                "message": "This lot alone already meets the buyer's minimum quantity."}

    # Defensive normalization: CSV round-trips turn empty strings into NaN,
    # which would otherwise get str()'d into the literal text "nan" and be
    # treated as a truthy (non-empty) fpo_id — silently misclassifying an
    # independent farmer as an FPO member. Normalize once, here, so callers
    # don't need to remember to do this themselves.
    all_lots_df = all_lots_df.copy()
    all_lots_df["fpo_id"] = all_lots_df["fpo_id"].fillna("").astype(str)
    raw_fpo_id = lot.get("fpo_id", "") if isinstance(lot, dict) else lot["fpo_id"]
    fpo_id = "" if pd.isna(raw_fpo_id) else str(raw_fpo_id).strip()
    group = []
    total_qty = lot["quantity_kg"]
    fpo_name = None

    if fpo_id and str(fpo_id).strip():
        fpo_candidates = all_lots_df[
            (all_lots_df["crop_type"] == lot["crop_type"])
            & (all_lots_df["status"] == "available")
            & (all_lots_df["lot_id"] != lot["lot_id"])
            & (all_lots_df["farmer_id"] != lot["farmer_id"])
            & (all_lots_df["fpo_id"] == fpo_id)
        ].copy()

        # Only count members whose grade the buyer would actually accept
        fpo_candidates["buyer_fit"] = fpo_candidates["quality_grade"].apply(
            lambda g: _quality_score(g, buyer["required_grade"])
        )
        fpo_candidates = fpo_candidates[fpo_candidates["buyer_fit"] >= 0.5]
        # Prefer the closest/most grade-similar members first, same as ad-hoc logic
        fpo_candidates["quality_compat"] = fpo_candidates["quality_grade"].apply(
            lambda g: _quality_score(g, lot["quality_grade"])
        )
        fpo_candidates["proximity"] = fpo_candidates.apply(
            lambda r: _location_score(lot["state"], lot["district"], r["state"], r["district"]), axis=1
        )
        fpo_candidates["rank_score"] = 0.5 * fpo_candidates["proximity"] + 0.5 * fpo_candidates["quality_compat"]
        fpo_candidates = fpo_candidates.sort_values("rank_score", ascending=False)

        if fpo_registry_df is not None:
            match = fpo_registry_df[fpo_registry_df["fpo_id"] == fpo_id]
            fpo_name = match.iloc[0]["name"] if len(match) else fpo_id
        else:
            fpo_name = fpo_id

        for _, cand in fpo_candidates.iterrows():
            if total_qty >= required_qty or len(group) >= max_group_size:
                break
            group.append({
                "source": "registered_fpo", "fpo_name": fpo_name,
                "farmer_id": cand["farmer_id"], "lot_id": cand["lot_id"],
                "quantity_kg": cand["quantity_kg"], "quality_grade": cand["quality_grade"],
                "state": cand["state"], "district": cand["district"],
            })
            total_qty += cand["quantity_kg"]

    # Top up with ad-hoc nearby independent farmers if still short
    if total_qty < required_qty and len(group) < max_group_size:
        already_used_lot_ids = {g["lot_id"] for g in group} | {lot["lot_id"]}
        adhoc_candidates = all_lots_df[
            (all_lots_df["crop_type"] == lot["crop_type"])
            & (all_lots_df["status"] == "available")
            & (~all_lots_df["lot_id"].isin(already_used_lot_ids))
            & (all_lots_df["farmer_id"] != lot["farmer_id"])
        ].copy()
        adhoc_candidates["buyer_fit"] = adhoc_candidates["quality_grade"].apply(
            lambda g: _quality_score(g, buyer["required_grade"])
        )
        adhoc_candidates = adhoc_candidates[adhoc_candidates["buyer_fit"] >= 0.5]
        adhoc_candidates["quality_compat"] = adhoc_candidates["quality_grade"].apply(
            lambda g: _quality_score(g, lot["quality_grade"])
        )
        adhoc_candidates["proximity"] = adhoc_candidates.apply(
            lambda r: _location_score(lot["state"], lot["district"], r["state"], r["district"]), axis=1
        )
        adhoc_candidates["rank_score"] = 0.5 * adhoc_candidates["proximity"] + 0.5 * adhoc_candidates["quality_compat"]
        adhoc_candidates = adhoc_candidates.sort_values("rank_score", ascending=False)

        for _, cand in adhoc_candidates.iterrows():
            if total_qty >= required_qty or len(group) >= max_group_size:
                break
            group.append({
                "source": "adhoc_nearby", "fpo_name": None,
                "farmer_id": cand["farmer_id"], "lot_id": cand["lot_id"],
                "quantity_kg": cand["quantity_kg"], "quality_grade": cand["quality_grade"],
                "state": cand["state"], "district": cand["district"],
            })
            total_qty += cand["quantity_kg"]

    target_met = total_qty >= required_qty
    n_fpo = sum(1 for g in group if g["source"] == "registered_fpo")
    n_adhoc = sum(1 for g in group if g["source"] == "adhoc_nearby")

    if target_met:
        if n_fpo and not n_adhoc:
            message = f"Your FPO ({fpo_name}) covers this \u2014 {n_fpo} member(s) reach {total_qty}kg (buyer needs {required_qty}kg)."
        elif n_fpo and n_adhoc:
            message = (f"Your FPO ({fpo_name}) covers part of this ({n_fpo} member(s)); "
                        f"topped up with {n_adhoc} nearby independent farmer(s) to reach {total_qty}kg "
                        f"(buyer needs {required_qty}kg).")
        elif n_adhoc:
            message = f"Combine with {n_adhoc} nearby independent farmer(s) to reach {total_qty}kg (buyer needs {required_qty}kg)."
        else:
            message = "This lot alone already meets the buyer's minimum quantity."
    else:
        source_desc = []
        if n_fpo:
            source_desc.append(f"{n_fpo} member(s) of {fpo_name}")
        if n_adhoc:
            source_desc.append(f"{n_adhoc} nearby independent farmer(s)")
        if source_desc:
            message = (f"Even combining with all available sources ({', '.join(source_desc)}), "
                        f"only {total_qty}kg reached \u2014 still short of the {required_qty}kg needed "
                        f"({required_qty - total_qty}kg short).")
        else:
            message = f"No farmers available to combine with. Only {total_qty}kg reached (buyer needs {required_qty}kg)."

    return {
        "aggregation_needed": True,
        "target_met": target_met,
        "total_quantity_kg": total_qty,
        "still_short_by_kg": max(0, required_qty - total_qty),
        "group": group,
        "message": message,
    }
