"""
5_demand_pool.py — "Instant Demand Pool"

A buyer-initiated, time-bound reverse-pooling mechanism — distinct from
4_buyer_lot_matching.py's FPO/ad-hoc aggregation (which is farmer-initiated,
one-off). Modeled directly on the app's own "Instant Demand Pool" landing
page design: a buyer opens a pool (crop, grade, minimum floor price, target
quantity, deadline). Independent farmers JOIN the pool at their own price
(must be >= the buyer's floor), contributing partial quantity, until the
pool fills or the deadline passes. Each farmer is paid at THEIR OWN listed
price (not one shared clearing price) — matching the reference design,
where different farmers show different rates within the same pool.

This is a genuinely STATEFUL mechanic (pools change as farmers join over
time), unlike the stateless scoring functions in 4_buyer_lot_matching.py —
but reuses that file's proximity logic, since PS 26132's "nearby buyers
only" requirement applies here too: farmers should primarily see pools
from buyers within a reasonable distance, not across the country.
"""

import pandas as pd
from datetime import datetime, timedelta
import uuid
import importlib.util

_spec = importlib.util.spec_from_file_location("matching", "4_buyer_lot_matching.py")
_matching = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_matching)
get_distance_km = _matching.get_distance_km
MAX_DISTANCE_KM = _matching.MAX_DISTANCE_KM


POOL_COLUMNS = ["pool_id", "buyer_id", "buyer_name", "crop_type", "required_grade",
                "min_bid_price", "state", "district", "target_quantity_kg",
                "filled_quantity_kg", "status", "created_at", "closes_at"]

CONTRIB_COLUMNS = ["pool_id", "farmer_id", "lot_id", "quantity_kg", "price_per_unit", "joined_at"]


def create_demand_pool(buyer_id, buyer_name, crop_type, required_grade,
                        min_bid_price, state, district, target_quantity_kg,
                        duration_hours=24, now=None):
    """Buyer opens a new pool. Returns a pool dict (caller appends it to their pools_df)."""
    now = now or datetime.now()
    return {
        "pool_id": f"POOL_{uuid.uuid4().hex[:8].upper()}",
        "buyer_id": buyer_id, "buyer_name": buyer_name,
        "crop_type": crop_type, "required_grade": required_grade,
        "min_bid_price": min_bid_price,
        "state": state, "district": district,
        "target_quantity_kg": target_quantity_kg,
        "filled_quantity_kg": 0,
        "status": "open",
        "created_at": now,
        "closes_at": now + timedelta(hours=duration_hours),
    }


def _refresh_pool_status(pool, as_of=None):
    """
    Auto-transitions a pool's status based on current time/fill level:
    open -> filled (target reached) or open -> expired (deadline passed).
    Filled takes priority over expired if both happen to be true at once
    (farmer who filled it right at the deadline still gets credit).
    Returns an updated COPY — never mutates the caller's dict in place.
    """
    as_of = as_of or datetime.now()
    pool = dict(pool)
    if pool["status"] == "open":
        if pool["filled_quantity_kg"] >= pool["target_quantity_kg"]:
            pool["status"] = "filled"
        elif pd.Timestamp(as_of) >= pd.Timestamp(pool["closes_at"]):
            pool["status"] = "expired"
    return pool


def list_open_pools(pools_df, crop_type=None, farmer_state=None, farmer_district=None,
                     as_of=None, max_distance_km=MAX_DISTANCE_KM):
    """
    Returns pools that are genuinely open (not filled/expired as of now),
    optionally filtered by crop and by proximity to the farmer (hard
    distance cutoff, same nearby-only philosophy as Part A — a farmer
    should not see a demand pool from a buyer 2000km away).
    Unmapped locations are NOT excluded (we don't penalize for missing
    data we simply don't have).
    """
    if len(pools_df) == 0:
        return pools_df.copy()

    as_of = as_of or datetime.now()
    refreshed = pd.DataFrame([_refresh_pool_status(r, as_of) for r in pools_df.to_dict("records")])
    df = refreshed[refreshed["status"] == "open"]

    if crop_type is not None:
        df = df[df["crop_type"] == crop_type]

    if farmer_state is not None and farmer_district is not None and len(df):
        def within_range(row):
            dist = get_distance_km(farmer_state, farmer_district, row["state"], row["district"])
            return dist is None or dist <= max_distance_km
        df = df[df.apply(within_range, axis=1)]

    return df.sort_values("closes_at").reset_index(drop=True)


def join_pool(pool, farmer_id, lot_id, quantity_kg, price_per_unit, contributions_df, as_of=None):
    """
    A farmer joins an open pool. Validates everything before accepting —
    never silently does something the farmer didn't ask for:
      - pool must actually be open (not filled/expired) as of `as_of`
      - price_per_unit must be >= the pool's floor (min_bid_price)
      - quantity is capped to whatever capacity remains (never overfills
        the pool) — if the farmer offered more than what's left, they're
        told exactly how much was actually accepted, not left to guess.

    Returns (updated_pool, updated_contributions_df, result_dict).
    """
    as_of = as_of or datetime.now()
    pool = _refresh_pool_status(pool, as_of)

    if pool["status"] != "open":
        return pool, contributions_df, {
            "accepted": False,
            "reason": f"Pool is {pool['status']}, no longer accepting contributions.",
        }

    if price_per_unit < pool["min_bid_price"]:
        return pool, contributions_df, {
            "accepted": False,
            "reason": f"Price {price_per_unit} is below the pool's minimum bid {pool['min_bid_price']}.",
        }

    remaining = pool["target_quantity_kg"] - pool["filled_quantity_kg"]
    if remaining <= 0:
        return pool, contributions_df, {"accepted": False, "reason": "Pool has no remaining capacity."}

    accepted_qty = min(quantity_kg, remaining)
    partial = accepted_qty < quantity_kg

    new_row = {
        "pool_id": pool["pool_id"], "farmer_id": farmer_id, "lot_id": lot_id,
        "quantity_kg": accepted_qty, "price_per_unit": price_per_unit, "joined_at": as_of,
    }
    contributions_df = pd.concat([contributions_df, pd.DataFrame([new_row])], ignore_index=True)

    pool = dict(pool)
    pool["filled_quantity_kg"] += accepted_qty
    pool = _refresh_pool_status(pool, as_of)

    return pool, contributions_df, {
        "accepted": True,
        "accepted_quantity_kg": accepted_qty,
        "partial": partial,
        "message": (
            f"Joined for {accepted_qty}kg (you offered {quantity_kg}kg, but only {remaining}kg was left)."
            if partial else f"Joined for {accepted_qty}kg."
        ),
    }


def calculate_payouts(pool, contributions_df):
    """
    Per-farmer payout at THEIR OWN listed price (quantity in kg / 100 to
    convert to quintals, since prices are quoted per quintal, e.g. ₹2,310/q
    — matching the reference design's per-farmer rates, not one shared
    clearing price for everyone).
    """
    pool_contribs = contributions_df[contributions_df["pool_id"] == pool["pool_id"]]
    payouts = []
    for _, row in pool_contribs.iterrows():
        quintals = row["quantity_kg"] / 100
        amount = round(quintals * row["price_per_unit"], 2)
        payouts.append({
            "farmer_id": row["farmer_id"], "lot_id": row["lot_id"],
            "quantity_kg": row["quantity_kg"], "price_per_unit": row["price_per_unit"],
            "payout_amount": amount,
        })
    total_payout = round(sum(p["payout_amount"] for p in payouts), 2)
    return {
        "pool_id": pool["pool_id"], "status": pool["status"],
        "total_quantity_kg": pool["filled_quantity_kg"],
        "payouts": payouts, "total_payout": total_payout,
    }
