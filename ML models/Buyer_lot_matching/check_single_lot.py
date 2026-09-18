import pandas as pd
import importlib.util

# ==========================================
# 1. LOAD YOUR MATCHING MODEL
# ==========================================

spec = importlib.util.spec_from_file_location(
    "matching",
    "4_buyer_lot_matching (1).py"
)

mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


# ==========================================
# 2. LOAD TEST DATA
# ==========================================

lots_df = pd.read_csv("test_lots.csv")
buyers_df = pd.read_csv("test_buyers.csv")


# ==========================================
# 3. SELECT THE LOT YOU WANT TO TEST
# ==========================================

LOT_ID = "L0000"       # <-- CHANGE THIS


lot = lots_df[lots_df["lot_id"] == LOT_ID]

if lot.empty:
    print(f"Lot {LOT_ID} not found!")
    exit()

lot = lot.iloc[0].to_dict()


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


# ==========================================
# 5. FIND TOP BUYER MATCHES
# ==========================================

matches = mod.rank_buyers_for_lot(
    lot,
    buyers_df,
    top_n=10
)


# ==========================================
# 6. DISPLAY RESULTS
# ==========================================

print("\n" + "=" * 70)
print("TOP BUYER MATCHES")
print("=" * 70)

if matches.empty:

    print("No matching buyers found.")

else:

    print(
        matches[
            [
                "buyer_id",
                "buyer_name",
                "overall_score",
                "quality_score",
                "quantity_score",
                "price_score",
                "location_score",
                "reliability_score"
            ]
        ].to_string(index=False)
    )


# ==========================================
# 7. SHOW DETAILED EXPLANATION FOR #1 MATCH
# ==========================================

if not matches.empty:

    best_buyer_id = matches.iloc[0]["buyer_id"]

    buyer = buyers_df[
        buyers_df["buyer_id"] == best_buyer_id
    ].iloc[0]

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
# 8. TEST AGGREGATION
# ==========================================

print("\n" + "=" * 70)
print("AGGREGATION ANALYSIS")
print("=" * 70)

# Select the buyer for whom we want to check aggregation.
# Here we use the BEST matching buyer.
if not matches.empty:

    best_buyer_id = matches.iloc[0]["buyer_id"]

    buyer = buyers_df[
        buyers_df["buyer_id"] == best_buyer_id
    ].iloc[0]

    aggregation_result = mod.suggest_aggregation_group(
        lot,
        buyer,
        lots_df
    )

    print(f"\nBuyer: {buyer['buyer_name']}")
    print(f"Buyer minimum quantity: {buyer['min_qty_kg']} kg")
    print(f"Current lot quantity: {lot['quantity_kg']} kg")

    print("\nAggregation Needed:",
          aggregation_result.get("aggregation_needed"))

    # ------------------------------------------
    # If aggregation is NOT required
    # ------------------------------------------

    if aggregation_result.get("aggregation_needed") == False:

        print("\nNo aggregation required.")
        print(aggregation_result["message"])

    # ------------------------------------------
    # If aggregation IS required
    # ------------------------------------------

    else:

        print("\nAggregation Required:",
              aggregation_result["aggregation_needed"])

        print("Target Met:",
              aggregation_result["target_met"])

        print("Total Quantity:",
              aggregation_result["total_quantity_kg"],
              "kg")

        print("Still Short By:",
              aggregation_result["still_short_by_kg"],
              "kg")

        print("\nMessage:")
        print(aggregation_result["message"])

        # --------------------------------------
        # Show the other farmers/lots selected
        # --------------------------------------

        group = aggregation_result["group"]

        if group:

            print("\nLots Suggested for Aggregation:")
            print("-" * 70)

            for i, item in enumerate(group, start=1):

                print(f"\n{i}. Lot ID       : {item['lot_id']}")
                print(f"   Farmer ID    : {item['farmer_id']}")
                print(f"   Quantity     : {item['quantity_kg']} kg")
                print(f"   Quality      : {item['quality_grade']}")
                print(f"   Location     : {item['district']}, {item['state']}")
                print(f"   Proximity    : {item['proximity_score']}")

        else:

            print("\nNo suitable lots found for aggregation.")