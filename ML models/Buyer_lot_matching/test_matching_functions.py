"""
Automated test suite for score_match, rank_buyers_for_lot, and
suggest_aggregation_group — runs against the synthetic test_lots.csv /
test_buyers.csv and checks specific expected behaviors, not just "did it
crash". Prints a clear PASS/FAIL per check.
"""

import pandas as pd
import numpy as np
import importlib.util

spec = importlib.util.spec_from_file_location("matching", "4_buyer_lot_matching (1).py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

lots_df = pd.read_csv("test_lots.csv")
buyers_df = pd.read_csv("test_buyers.csv")

passed, failed = 0, 0


def check(label, condition):
    global passed, failed
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {label}")
    if condition:
        passed += 1
    else:
        failed += 1


def get_lot(lot_id):
    return lots_df[lots_df["lot_id"] == lot_id].iloc[0].to_dict()


def get_buyer(buyer_id):
    return buyers_df[buyers_df["buyer_id"] == buyer_id]


print("=" * 60)
print("TEST GROUP 1: score_match / rank_buyers_for_lot")
print("=" * 60)

# 1. Perfect match should score very close to 1.0
perfect_lot = get_lot("EDGE_LOT_PERFECT")
perfect_buyer = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_PERFECT"].iloc[0]
result = mod.score_match(perfect_lot, perfect_buyer)
check(f"Perfect match scores >= 0.95 (got {result['overall_score']})", result["overall_score"] >= 0.95)

# 2. Wrong-crop buyer must NEVER appear for an Onion lot, even among 159 buyers
onion_matches = mod.rank_buyers_for_lot(perfect_lot, buyers_df, top_n=1000)
non_onion_in_results = (onion_matches["buyer_id"].isin(
    buyers_df[buyers_df["crop_type"] != "Onion"]["buyer_id"]
)).any()
check("No wrong-crop buyers ever appear in an Onion lot's matches", not non_onion_in_results)

# 3. Buyer wanting a crop nobody has -> empty result, no crash
nocrop_buyer_row = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_NOCROP"].iloc[0]
mustard_lot = {"lot_id": "X", "crop_type": "Mustard", "quantity_kg": 100,
               "quality_grade": "FAQ", "state": "Bihar", "district": "Patna", "asking_price": 2000}
no_match_result = mod.score_match(mustard_lot, nocrop_buyer_row)
# crop matches here (both Mustard) so it should NOT be None — sanity check the reverse too
check("Matching crop (Mustard=Mustard) does NOT return None", no_match_result is not None)

wheat_lot_for_mustard_buyer = {"lot_id": "Y", "crop_type": "Wheat", "quantity_kg": 100,
                                "quality_grade": "FAQ", "state": "Bihar", "district": "Patna", "asking_price": 2000}
mismatch_result = mod.score_match(wheat_lot_for_mustard_buyer, nocrop_buyer_row)
check("Wrong crop (Wheat vs Mustard) returns None", mismatch_result is None)

# 4. Unknown grade doesn't crash and falls back gracefully
unknown_grade_lot = get_lot("EDGE_LOT_UNKNOWNGRADE")
wheat_buyers = buyers_df[buyers_df["crop_type"] == "Wheat"]
try:
    unknown_grade_result = mod.rank_buyers_for_lot(unknown_grade_lot, wheat_buyers)
    check("Unknown grade ('Grade X-Special') does not crash", True)
except Exception as e:
    check(f"Unknown grade does not crash (error: {e})", False)

# 5. Verified buyer with no rating -> reliability defaults to 0.8
verified_norating = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_VERIFIED_NORATING"].iloc[0]
r = mod.score_match(unknown_grade_lot, verified_norating)
check(f"Verified + no rating -> reliability_score == 0.8 (got {r['reliability_score']})",
      abs(r["reliability_score"] - 0.8) < 1e-6)

# 6. Unverified buyer with no rating -> reliability defaults to 0.5
unverified_norating = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_UNVERIFIED_NORATING"].iloc[0]
r2 = mod.score_match(unknown_grade_lot, unverified_norating)
check(f"Unverified + no rating -> reliability_score == 0.5 (got {r2['reliability_score']})",
      abs(r2["reliability_score"] - 0.5) < 1e-6)

# 7. Tiny lot vs huge minimum -> low but nonzero, valid quantity_score
tiny_lot = get_lot("EDGE_LOT_TINY")
hugemin_buyer = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_HUGEMIN"].iloc[0]
r3 = mod.score_match(tiny_lot, hugemin_buyer)
check(f"Tiny lot vs huge min -> 0 <= quantity_score < 0.1 (got {r3['quantity_score']})",
      0 <= r3["quantity_score"] < 0.1)

# 8. Huge lot vs tiny max -> low but nonzero quantity_score
huge_lot = get_lot("EDGE_LOT_HUGE")
tinymax_buyer = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_TINYMAX"].iloc[0]
r4 = mod.score_match(huge_lot, tinymax_buyer)
check(f"Huge lot vs tiny max -> 0 <= quantity_score < 0.1 (got {r4['quantity_score']})",
      0 <= r4["quantity_score"] < 0.1)

# 9. Expensive lot vs low budget -> low but nonzero price_score
expensive_lot = get_lot("EDGE_LOT_EXPENSIVE")
lowbudget_buyer = buyers_df[buyers_df["buyer_id"] == "EDGE_BUYER_LOWBUDGET"].iloc[0]
r5 = mod.score_match(expensive_lot, lowbudget_buyer)
check(f"Expensive lot vs low budget -> price_score < 0.3 (got {r5['price_score']})",
      r5["price_score"] < 0.3)

# 10. All scores across the full random dataset are valid (0-1 range, no NaN/crash)
sample_lots = lots_df.sample(30, random_state=1).to_dict("records")
all_scores_valid = True
for lot in sample_lots:
    matches = mod.rank_buyers_for_lot(lot, buyers_df, top_n=10)
    if len(matches) > 0:
        score_cols = [c for c in matches.columns if c.endswith("_score")]
        for col in score_cols:
            if matches[col].isna().any() or (matches[col] < 0).any() or (matches[col] > 1).any():
                all_scores_valid = False
check("All scores stay within [0,1] across 30 random lots x 159 buyers", all_scores_valid)

print()
print("=" * 60)
print("TEST GROUP 2: suggest_aggregation_group")
print("=" * 60)

# 11. Lot already big enough -> aggregation_needed False
already_big_buyer = get_buyer("EDGE_BUYER_PERFECT").iloc[0]  # min_qty 300, our lot has 500
already_big_result = mod.suggest_aggregation_group(perfect_lot, already_big_buyer, lots_df)
check("Lot already meeting minimum -> aggregation_needed == False",
      already_big_result["aggregation_needed"] == False)

# 12. Aggregation succeeds and reaches target
agg_main_lot = get_lot("EDGE_AGG_MAIN")
agg_buyer = get_buyer("EDGE_AGG_BUYER").iloc[0]
agg_result = mod.suggest_aggregation_group(agg_main_lot, agg_buyer, lots_df)
check(f"Aggregation reaches target (target_met={agg_result['target_met']}, total={agg_result['total_quantity_kg']})",
      agg_result["target_met"] == True)

# 13. Same farmer's other lot excluded from the group
group_farmer_ids = [g["farmer_id"] for g in agg_result["group"]]
check("Same farmer's own other lot (F_AGGMAIN) excluded from aggregation group",
      "F_AGGMAIN" not in group_farmer_ids)

# 14. Sold lot excluded from the group
group_lot_ids = [g["lot_id"] for g in agg_result["group"]]
check("Sold lot (EDGE_AGG_SOLDLOT) excluded from aggregation group",
      "EDGE_AGG_SOLDLOT" not in group_lot_ids)

# 15. Shortfall case: not enough supply even after aggregating everything
#     (isolated to ONLY the two deliberately tiny lots, so the large random
#     dataset's other Rice supply doesn't mask the scenario being tested)
shortfall_lot = get_lot("EDGE_AGG_SHORTFALL_MAIN")
shortfall_partner = get_lot("EDGE_AGG_SHORTFALL_PARTNER")
shortfall_buyer = get_buyer("EDGE_SHORTFALL_BUYER").iloc[0]
isolated_shortfall_lots = pd.DataFrame([shortfall_lot, shortfall_partner])
shortfall_result = mod.suggest_aggregation_group(shortfall_lot, shortfall_buyer, isolated_shortfall_lots)
check(f"Shortfall case correctly reports target_met=False (total={shortfall_result['total_quantity_kg']}, needed={shortfall_buyer['min_qty_kg']})",
      shortfall_result["target_met"] == False)

# 16. No-candidates case (crop exists only as the query lot itself) -> clean empty group, no crash
lone_crop_lot = {"lot_id": "SOLO_TEST", "farmer_id": "F_SOLO", "crop_type": "Onion",
                  "quantity_kg": 10, "quality_grade": "Grade A", "state": "Karnataka",
                  "district": "Belagavi", "asking_price": 2000}
lone_lots_df = lots_df[lots_df["crop_type"] != "Onion"]  # remove ALL onion lots to force zero candidates
lone_buyer = {"buyer_id": "X", "buyer_name": "X", "crop_type": "Onion", "required_grade": "Grade A",
              "min_qty_kg": 1000, "max_qty_kg": 5000, "max_price": 3000,
              "state": "Karnataka", "district": "Belagavi", "verified": True, "rating": 4.0}
no_candidates_result = mod.suggest_aggregation_group(lone_crop_lot, lone_buyer, lone_lots_df)
check("Zero-candidates case handled cleanly (no crash, target_met=False)",
      no_candidates_result["target_met"] == False and len(no_candidates_result["group"]) == 0)

print()
print("=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed (out of {passed + failed})")
print("=" * 60)
