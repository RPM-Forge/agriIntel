"""
Generates large synthetic LOTS and BUYERS datasets to stress-test the
buyer-lot matching functions (score_match, rank_buyers_for_lot,
suggest_aggregation_group) against every condition they need to handle.

Produces:
  - test_lots.csv    (~800 rows)
  - test_buyers.csv  (~150 rows)

Includes BOTH large-scale random data (for volume/performance testing) AND
deliberately hand-crafted edge cases (prefixed with "EDGE_" in their IDs) to
guarantee specific scenarios are covered, not left to chance:

  - Perfect match (exact grade, quantity in range, price in budget, same
    district, high rating) -> should score close to 1.0
  - Completely wrong crop -> must NEVER appear in another crop's results
  - Unknown/unlisted grade (not in GRADE_RANK) -> tests the fallback default
  - Verified buyer with NO rating yet -> tests the 0.8 default
  - Unverified buyer with NO rating -> tests the 0.5 default
  - Lot quantity far below buyer's minimum -> low but nonzero quantity_score
  - Lot quantity far above buyer's maximum -> low but nonzero quantity_score
  - Price far above buyer's budget -> low but nonzero price_score
  - Same farmer's other lot -> must be excluded from aggregation candidates
  - A "sold"/"matched" status lot -> must be excluded from aggregation candidates
  - A crop with ZERO other available farmers -> aggregation must return
    target_met=False cleanly, no crash
  - Enough small lots of matching quality to hit an aggregation target
  - NOT enough lots even after aggregating everything available (partial fill)
"""

import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

CROPS = ["Onion", "Tomato", "Potato", "Wheat", "Rice"]
GRADES = ["Grade A", "Grade B", "Grade C", "FAQ"]

STATE_DISTRICTS = {
    "Maharashtra": ["Nashik", "Pune", "Nagpur"],
    "Uttar Pradesh": ["Auraiya", "Sitapur", "Lucknow"],
    "Bihar": ["Patna", "Gaya"],
    "Gujarat": ["Surat", "Rajkot"],
    "Karnataka": ["Bengaluru Rural", "Belagavi"],
}

CROP_PRICE_RANGE = {
    "Onion": (1500, 3000), "Tomato": (1000, 4000), "Potato": (1000, 2500),
    "Wheat": (2000, 2800), "Rice": (1800, 3200),
}

STATUSES_POOL = ["available"] * 8 + ["matched"] * 1 + ["sold"] * 1  # mostly available, some not


def random_location():
    state = random.choice(list(STATE_DISTRICTS.keys()))
    district = random.choice(STATE_DISTRICTS[state])
    return state, district


# ---------------- Generate random LOTS ----------------
lots = []
for i in range(800):
    crop = random.choice(CROPS)
    state, district = random_location()
    lo, hi = CROP_PRICE_RANGE[crop]
    lots.append({
        "lot_id": f"L{i:04d}",
        "farmer_id": f"F{random.randint(1, 300):04d}",
        "crop_type": crop,
        "quantity_kg": random.randint(50, 2000),
        "quality_grade": random.choice(GRADES),
        "state": state,
        "district": district,
        "asking_price": random.randint(lo, hi),
        "status": random.choice(STATUSES_POOL),
    })

# ---------------- Generate random BUYERS ----------------
buyers = []
for i in range(150):
    crop = random.choice(CROPS)
    state, district = random_location()
    lo, hi = CROP_PRICE_RANGE[crop]
    min_qty = random.choice([200, 500, 1000, 2000])
    # rating: ~20% missing (new/unrated buyers), rest 2.5-5.0
    rating = np.nan if random.random() < 0.2 else round(random.uniform(2.5, 5.0), 1)
    buyers.append({
        "buyer_id": f"B{i:04d}",
        "buyer_name": f"Buyer Company {i}",
        "crop_type": crop,
        "required_grade": random.choice(GRADES),
        "min_qty_kg": min_qty,
        "max_qty_kg": min_qty + random.randint(500, 4000),
        "max_price": random.randint(lo, hi + 300),  # some buyers pay above typical range too
        "state": state,
        "district": district,
        "verified": random.random() < 0.75,  # 75% verified
        "rating": rating,
    })

# ---------------- Hand-crafted EDGE CASES ----------------

# 1. Perfect match pair (for a specific test lot EDGE_LOT_PERFECT)
lots.append({"lot_id": "EDGE_LOT_PERFECT", "farmer_id": "F_EDGE1", "crop_type": "Onion",
             "quantity_kg": 500, "quality_grade": "Grade A", "state": "Maharashtra",
             "district": "Nashik", "asking_price": 2200, "status": "available"})
buyers.append({"buyer_id": "EDGE_BUYER_PERFECT", "buyer_name": "Perfect Match Co",
               "crop_type": "Onion", "required_grade": "Grade A", "min_qty_kg": 300,
               "max_qty_kg": 1000, "max_price": 2300, "state": "Maharashtra",
               "district": "Nashik", "verified": True, "rating": 5.0})

# 2. Buyer wants a crop nobody grows in this test set at all -> must return empty, not crash
buyers.append({"buyer_id": "EDGE_BUYER_NOCROP", "buyer_name": "No Match Possible Co",
               "crop_type": "Mustard", "required_grade": "FAQ", "min_qty_kg": 100,
               "max_qty_kg": 500, "max_price": 5000, "state": "Bihar",
               "district": "Patna", "verified": True, "rating": 4.0})

# 3. Lot with an UNKNOWN grade not in GRADE_RANK (tests fallback default rank)
lots.append({"lot_id": "EDGE_LOT_UNKNOWNGRADE", "farmer_id": "F_EDGE2", "crop_type": "Wheat",
             "quantity_kg": 800, "quality_grade": "Grade X-Special", "state": "Uttar Pradesh",
             "district": "Lucknow", "asking_price": 2400, "status": "available"})

# 4. Verified buyer with NO rating (tests 0.8 default reliability)
buyers.append({"buyer_id": "EDGE_BUYER_VERIFIED_NORATING", "buyer_name": "New Verified Buyer",
               "crop_type": "Wheat", "required_grade": "FAQ", "min_qty_kg": 100,
               "max_qty_kg": 2000, "max_price": 2800, "state": "Uttar Pradesh",
               "district": "Lucknow", "verified": True, "rating": np.nan})

# 5. UNVERIFIED buyer with NO rating (tests 0.5 default reliability)
buyers.append({"buyer_id": "EDGE_BUYER_UNVERIFIED_NORATING", "buyer_name": "Unverified New Buyer",
               "crop_type": "Wheat", "required_grade": "FAQ", "min_qty_kg": 100,
               "max_qty_kg": 2000, "max_price": 2800, "state": "Uttar Pradesh",
               "district": "Lucknow", "verified": False, "rating": np.nan})

# 6. Lot quantity WAY below any reasonable buyer minimum (tests partial quantity_score)
lots.append({"lot_id": "EDGE_LOT_TINY", "farmer_id": "F_EDGE3", "crop_type": "Potato",
             "quantity_kg": 20, "quality_grade": "Grade A", "state": "Gujarat",
             "district": "Surat", "asking_price": 1800, "status": "available"})
buyers.append({"buyer_id": "EDGE_BUYER_HUGEMIN", "buyer_name": "Bulk Only Buyer",
               "crop_type": "Potato", "required_grade": "Grade A", "min_qty_kg": 5000,
               "max_qty_kg": 20000, "max_price": 2200, "state": "Gujarat",
               "district": "Surat", "verified": True, "rating": 4.5})

# 7. Lot quantity WAY above buyer's max (tests partial quantity_score from the other side)
lots.append({"lot_id": "EDGE_LOT_HUGE", "farmer_id": "F_EDGE4", "crop_type": "Rice",
             "quantity_kg": 10000, "quality_grade": "FAQ", "state": "Bihar",
             "district": "Gaya", "asking_price": 2000, "status": "available"})
buyers.append({"buyer_id": "EDGE_BUYER_TINYMAX", "buyer_name": "Small Retailer",
               "crop_type": "Rice", "required_grade": "FAQ", "min_qty_kg": 50,
               "max_qty_kg": 200, "max_price": 2200, "state": "Bihar",
               "district": "Gaya", "verified": True, "rating": 3.5})

# 8. Price far above buyer's budget (tests partial price_score)
lots.append({"lot_id": "EDGE_LOT_EXPENSIVE", "farmer_id": "F_EDGE5", "crop_type": "Tomato",
             "quantity_kg": 500, "quality_grade": "Grade A", "state": "Karnataka",
             "district": "Belagavi", "asking_price": 8000, "status": "available"})
buyers.append({"buyer_id": "EDGE_BUYER_LOWBUDGET", "buyer_name": "Budget Buyer",
               "crop_type": "Tomato", "required_grade": "Grade A", "min_qty_kg": 200,
               "max_qty_kg": 1000, "max_price": 2000, "state": "Karnataka",
               "district": "Belagavi", "verified": True, "rating": 4.0})

# 9. AGGREGATION test setup: one small lot + several other farmers' lots
#    that together should comfortably reach a buyer's minimum.
lots.append({"lot_id": "EDGE_AGG_MAIN", "farmer_id": "F_AGGMAIN", "crop_type": "Onion",
             "quantity_kg": 200, "quality_grade": "Grade A", "state": "Maharashtra",
             "district": "Nashik", "asking_price": 2200, "status": "available"})
for j, (qty, grade, dist) in enumerate([
    (300, "Grade A", "Nashik"), (400, "Grade A", "Pune"),
    (250, "FAQ", "Nashik"), (500, "Grade C", "Nashik"),  # bad grade fit for the buyer below, should rank low/excluded
]):
    lots.append({"lot_id": f"EDGE_AGG_PARTNER{j}", "farmer_id": f"F_AGGPARTNER{j}",
                 "crop_type": "Onion", "quantity_kg": qty, "quality_grade": grade,
                 "state": "Maharashtra", "district": dist, "asking_price": 2150,
                 "status": "available"})
buyers.append({"buyer_id": "EDGE_AGG_BUYER", "buyer_name": "Big Aggregation Buyer",
               "crop_type": "Onion", "required_grade": "Grade A", "min_qty_kg": 1000,
               "max_qty_kg": 5000, "max_price": 2400, "state": "Maharashtra",
               "district": "Nashik", "verified": True, "rating": 4.3})

# 10. Same farmer's OTHER lot must be excluded from aggregation candidates
lots.append({"lot_id": "EDGE_AGG_SAMEFARMER", "farmer_id": "F_AGGMAIN", "crop_type": "Onion",
             "quantity_kg": 2000, "quality_grade": "Grade A", "state": "Maharashtra",
             "district": "Nashik", "asking_price": 2200, "status": "available"})

# 11. A "sold" lot that must be excluded from aggregation candidates
lots.append({"lot_id": "EDGE_AGG_SOLDLOT", "farmer_id": "F_AGGSOLD", "crop_type": "Onion",
             "quantity_kg": 2000, "quality_grade": "Grade A", "state": "Maharashtra",
             "district": "Nashik", "asking_price": 2200, "status": "sold"})

# 12. AGGREGATION test that CANNOT reach target even using everything available
lots.append({"lot_id": "EDGE_AGG_SHORTFALL_MAIN", "farmer_id": "F_SHORTMAIN", "crop_type": "Rice",
             "quantity_kg": 50, "quality_grade": "FAQ", "state": "Bihar",
             "district": "Patna", "asking_price": 1900, "status": "available"})
lots.append({"lot_id": "EDGE_AGG_SHORTFALL_PARTNER", "farmer_id": "F_SHORTPARTNER", "crop_type": "Rice",
             "quantity_kg": 60, "quality_grade": "FAQ", "state": "Bihar",
             "district": "Patna", "asking_price": 1900, "status": "available"})
buyers.append({"buyer_id": "EDGE_SHORTFALL_BUYER", "buyer_name": "Huge Rice Buyer",
               "crop_type": "Rice", "required_grade": "FAQ", "min_qty_kg": 10000,
               "max_qty_kg": 50000, "max_price": 2200, "state": "Bihar",
               "district": "Patna", "verified": True, "rating": 4.0})

lots_df = pd.DataFrame(lots)
buyers_df = pd.DataFrame(buyers)

lots_df.to_csv("test_lots.csv", index=False)
buyers_df.to_csv("test_buyers.csv", index=False)

print(f"Generated {len(lots_df):,} lots -> test_lots.csv")
print(f"Generated {len(buyers_df):,} buyers -> test_buyers.csv")
print(f"\nStatus breakdown in lots:\n{lots_df['status'].value_counts()}")
print(f"\nRating missing in buyers: {buyers_df['rating'].isna().sum()} of {len(buyers_df)}")
