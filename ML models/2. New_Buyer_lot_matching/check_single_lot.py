"""
Quick single-lot checker — same idea as your original script, updated to
use the FPO-aware suggest_aggregation_group_v2() instead of the old
suggest_aggregation_group(). Shows buyer matches AND, for aggregation,
whether the suggested partners came from the farmer's own registered FPO
or from ad-hoc nearby independent farmers.

HOW TO USE:
1. Put this file in the same folder as: 4_buyer_lot_matching.py,
   test_lots.csv, test_buyers.csv, fpo_registry.csv
2. Change LOT_ID below to whichever lot you want to inspect
3. Run: python check_single_lot.py
"""

import pandas as pd
import importlib.util

# ==========================================
# 1. LOAD YOUR MATCHING MODEL
# ==========================================

spec = importlib.util.spec_from_file_location(
    "matching",
    "4_buyer_lot_matching.py"   # <-- update this filename if yours differs
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# ==========================================
# 2. LOAD TEST DATA
# ==========================================

lots_df = pd.read_csv("test_lots.csv")
lots_df["fpo_id"] = lots_df["fpo_id"].fillna("")   # normalize empty FPO membership
buyers_df = pd.read_csv("test_buyers.csv")
fpo_registry_df = pd.read_csv("fpo_registry.csv")

# ==========================================
# 3. SELECT THE LOT YOU WANT TO TEST
# ==========================================

LOT_ID = "L00022"       # <-- CHANGE THIS

lot_row = lots_df[lots_df["lot_id"] == LOT_ID]
if lot_row.empty:
    print(f"Lot {LOT_ID} not found!")
    exit()
lot = lot_row.iloc[0].to_dict()

# ==========================================
# 4. DISPLAY THE LOT
# ==========================================

print("\n" + "=" * 70)
print("LOT BEING TESTED")
print("=" * 70)
print(f"Lot ID       : {lot['lot_id']}")
print(f"Farmer ID    : {lot['farmer_id']}")
print(f"Crop         : {lot['crop_type']}")
print(f"Quantity     : {lot['quantity_kg']} kg")
print(f"Quality      : {lot['quality_grade']}")
print(f"Location     : {lot['district']}, {lot['state']}")
print(f"Asking Price : ₹{lot['asking_price']}")
print(f"Status       : {lot['status']}")
fpo_label = lot['fpo_id'] if lot['fpo_id'] else "(independent — not in any FPO)"
print(f"FPO          : {fpo_label}")

# ==========================================
# 5. FIND TOP BUYER MATCHES
# ==========================================

matches = mod.rank_buyers_for_lot(lot, buyers_df, top_n=10)

print("\n" + "=" * 70)
print("TOP BUYER MATCHES")
print("=" * 70)

if matches.empty:
    print("No matching buyers found.")
else:
    print(matches[[
        "buyer_id", "buyer_name", "overall_score", "quality_score",
        "quantity_score", "price_score", "location_score", "reliability_score",
    ]].to_string(index=False))

# ==========================================
# 6. SHOW DETAILED EXPLANATION FOR #1 MATCH
# ==========================================

if not matches.empty:
    best_buyer_id = matches.iloc[0]["buyer_id"]
    buyer = buyers_df[buyers_df["buyer_id"] == best_buyer_id].iloc[0]
    result = mod.score_match(lot, buyer)

    print("\n" + "=" * 70)
    print("BEST MATCH — DETAILED BREAKDOWN")
    print("=" * 70)
    print(f"Buyer ID       : {result['buyer_id']}")
    print(f"Buyer Name     : {result['buyer_name']}")
    print(f"\nOverall Score  : {result['overall_score']:.4f}")
    print("\nScore Breakdown:")
    print(f"  Quality      : {result['quality_score']:.4f}")
    print(f"  Quantity     : {result['quantity_score']:.4f}")
    print(f"  Price        : {result['price_score']:.4f}")
    print(f"  Location     : {result['location_score']:.4f}")
    print(f"  Reliability  : {result['reliability_score']:.4f}")
    print("\nBuyer Requirements:")
    print(f"  Crop         : {buyer['crop_type']}")
    print(f"  Grade        : {buyer['required_grade']}")
    print(f"  Quantity     : {buyer['min_qty_kg']} - {buyer['max_qty_kg']} kg")
    print(f"  Max Price    : ₹{buyer['max_price']}")
    print(f"  Location     : {buyer['district']}, {buyer['state']}")
    print(f"  Verified     : {buyer['verified']}")
    print(f"  Rating       : {buyer['rating']}")

# ==========================================
# 7. TEST AGGREGATION (FPO-aware, v2)
# ==========================================

print("\n" + "=" * 70)
print("AGGREGATION ANALYSIS (FPO-aware)")
print("=" * 70)

if not matches.empty:
    best_buyer_id = matches.iloc[0]["buyer_id"]
    buyer = buyers_df[buyers_df["buyer_id"] == best_buyer_id].iloc[0]

    aggregation_result = mod.suggest_aggregation_group_v2(
        lot, buyer, lots_df, fpo_registry_df
    )

    print(f"\nBuyer: {buyer['buyer_name']}")
    print(f"Buyer minimum quantity: {buyer['min_qty_kg']} kg")
    print(f"Current lot quantity: {lot['quantity_kg']} kg")
    print("\nAggregation Needed:", aggregation_result.get("aggregation_needed"))

    if aggregation_result.get("aggregation_needed") == False:
        print("\nNo aggregation required.")
        print(aggregation_result["message"])
    else:
        print("\nTarget Met:", aggregation_result["target_met"])
        print("Total Quantity:", aggregation_result["total_quantity_kg"], "kg")
        print("Still Short By:", aggregation_result["still_short_by_kg"], "kg")
        print("\nMessage:")
        print(aggregation_result["message"])

        group = aggregation_result["group"]
        if group:
            print("\nLots Suggested for Aggregation:")
            print("-" * 70)
            for i, item in enumerate(group, start=1):
                source_label = ("Your FPO: " + item["fpo_name"]) if item["source"] == "registered_fpo" \
                                else "Ad-hoc nearby farmer"
                print(f"\n{i}. Source       : {source_label}")
                print(f"   Lot ID       : {item['lot_id']}")
                print(f"   Farmer ID    : {item['farmer_id']}")
                print(f"   Quantity     : {item['quantity_kg']} kg")
                print(f"   Quality      : {item['quality_grade']}")
                print(f"   Location     : {item['district']}, {item['state']}")
        else:
            print("\nNo suitable lots found for aggregation.")
