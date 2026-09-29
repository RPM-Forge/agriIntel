import pandas as pd
from datetime import datetime, timedelta
import importlib.util

spec = importlib.util.spec_from_file_location("pool_mod", "5_demand_pool.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

passed, failed = 0, 0
def check(label, cond):
    global passed, failed
    print(f"[{'PASS' if cond else 'FAIL'}] {label}")
    passed += cond; failed += not cond

NOW = datetime(2026, 9, 22, 10, 0, 0)

# ---- Test 1: create + join within floor price, capacity not exceeded ----
pool = mod.create_demand_pool("B1", "ITC Agri Procurement", "Wheat", "Grade A",
                               2300, "Madhya Pradesh", "Indore", 20000, duration_hours=18, now=NOW)
contribs = pd.DataFrame(columns=mod.CONTRIB_COLUMNS)

pool, contribs, r1 = mod.join_pool(pool, "F_RAMESH", "L1", 3200, 2310, contribs, as_of=NOW+timedelta(hours=1))
check("Valid join accepted", r1["accepted"] and r1["accepted_quantity_kg"] == 3200)
check("Pool filled_quantity updates correctly", pool["filled_quantity_kg"] == 3200)

pool, contribs, r2 = mod.join_pool(pool, "F_SUNITA", "L2", 2100, 2305, contribs, as_of=NOW+timedelta(hours=2))
check("Second valid join accepted", r2["accepted"] and pool["filled_quantity_kg"] == 5300)

# ---- Test 2: price below floor rejected ----
pool, contribs, r3 = mod.join_pool(pool, "F_LOWBALL", "L3", 1000, 2000, contribs, as_of=NOW+timedelta(hours=3))
check("Below-floor price rejected", not r3["accepted"] and "below" in r3["reason"].lower())
check("Rejected join does NOT change filled_quantity", pool["filled_quantity_kg"] == 5300)

# ---- Test 3: overfill gets capped to remaining capacity ----
big_pool = mod.create_demand_pool("B2", "Small Buyer", "Onion", "FAQ", 1500,
                                   "Maharashtra", "Nashik", 1000, duration_hours=24, now=NOW)
big_contribs = pd.DataFrame(columns=mod.CONTRIB_COLUMNS)
big_pool, big_contribs, r4 = mod.join_pool(big_pool, "F_X", "LX", 800, 1600, big_contribs, as_of=NOW)
big_pool, big_contribs, r5 = mod.join_pool(big_pool, "F_Y", "LY", 500, 1550, big_contribs, as_of=NOW)
check(f"Overfilling join gets capped (offered 500, remaining was 200, got {r5['accepted_quantity_kg']})",
      r5["accepted"] and r5["partial"] and r5["accepted_quantity_kg"] == 200)
check("Pool exactly at target after capped join", big_pool["filled_quantity_kg"] == 1000)

# ---- Test 4: pool auto-closes as 'filled' once target reached ----
check("Pool status auto-updates to 'filled'", big_pool["status"] == "filled")

# ---- Test 5: joining a filled pool is rejected cleanly ----
big_pool, big_contribs, r6 = mod.join_pool(big_pool, "F_Z", "LZ", 100, 1600, big_contribs, as_of=NOW)
check("Join to an already-filled pool rejected, no crash", not r6["accepted"])

# ---- Test 6: pool auto-expires after deadline, further joins rejected ----
short_pool = mod.create_demand_pool("B3", "Quick Buyer", "Rice", "FAQ", 1800,
                                     "Punjab", "Amritsar", 5000, duration_hours=2, now=NOW)
short_contribs = pd.DataFrame(columns=mod.CONTRIB_COLUMNS)
past_deadline = NOW + timedelta(hours=5)  # well past the 2-hour deadline
short_pool, short_contribs, r7 = mod.join_pool(short_pool, "F_LATE", "LL", 500, 1900, short_contribs, as_of=past_deadline)
check("Join attempt after deadline is rejected (expired)", not r7["accepted"] and "expired" in r7["reason"])

# ---- Test 7: list_open_pools filters out filled/expired, keeps genuinely open ----
all_pools = pd.DataFrame([pool, big_pool, short_pool])  # 1 open, 1 filled, 1 expired
open_now = mod.list_open_pools(all_pools, as_of=NOW+timedelta(hours=3))
check(f"list_open_pools returns only the genuinely open pool (got {len(open_now)})",
      len(open_now) == 1 and open_now.iloc[0]["pool_id"] == pool["pool_id"])

# ---- Test 8: list_open_pools respects crop filter ----
onion_pools = mod.list_open_pools(all_pools, crop_type="Onion", as_of=NOW)
check("Crop filter works (Onion pool is 'filled' by now, so 0 open onion pools)", len(onion_pools) == 0)

# ---- Test 9: list_open_pools hard-excludes far-away pools (same MAX_DISTANCE_KM cutoff as Part A) ----
far_pool = mod.create_demand_pool("B4", "Far Buyer", "Wheat", "Grade A", 2200,
                                   "West Bengal", "Kolkata", 5000, duration_hours=24, now=NOW)
mixed_pools = pd.DataFrame([pool, far_pool])  # pool is in Indore, MP; far_pool is Kolkata
nearby_only = mod.list_open_pools(mixed_pools, crop_type="Wheat",
                                   farmer_state="Madhya Pradesh", farmer_district="Indore",
                                   as_of=NOW+timedelta(minutes=30))
check(f"Far-away pool (Kolkata) excluded when farmer is in Indore (got {len(nearby_only)} pool(s))",
      len(nearby_only) == 1 and nearby_only.iloc[0]["pool_id"] == pool["pool_id"])

# ---- Test 10: calculate_payouts gives each farmer THEIR OWN price, not a shared clearing price ----
payout_result = mod.calculate_payouts(pool, contribs)
ramesh_payout = next(p for p in payout_result["payouts"] if p["farmer_id"] == "F_RAMESH")
sunita_payout = next(p for p in payout_result["payouts"] if p["farmer_id"] == "F_SUNITA")
expected_ramesh = round(3200/100 * 2310, 2)
expected_sunita = round(2100/100 * 2305, 2)
check(f"Ramesh payout correct at HIS price (expected {expected_ramesh}, got {ramesh_payout['payout_amount']})",
      ramesh_payout["payout_amount"] == expected_ramesh)
check(f"Sunita payout correct at HER price (expected {expected_sunita}, got {sunita_payout['payout_amount']})",
      sunita_payout["payout_amount"] == expected_sunita)
check("Different farmers got DIFFERENT per-unit prices (not one shared clearing price)",
      ramesh_payout["price_per_unit"] != sunita_payout["price_per_unit"])
check("Total payout = sum of individual payouts",
      payout_result["total_payout"] == round(expected_ramesh + expected_sunita, 2))

# ---- Test 11: unmapped location doesn't wrongly exclude a pool (no info != far away) ----
unmapped_pool = mod.create_demand_pool("B5", "Unmapped Buyer", "Wheat", "Grade A", 2200,
                                        "Madhya Pradesh", "SomeVillageNotInCoords", 5000,
                                        duration_hours=24, now=NOW)
unmapped_check = mod.list_open_pools(pd.DataFrame([unmapped_pool]), crop_type="Wheat",
                                      farmer_state="Madhya Pradesh", farmer_district="Indore",
                                      as_of=NOW+timedelta(minutes=30))
check("Unmapped-location pool NOT wrongly excluded (no distance data != too far)", len(unmapped_check) == 1)

print(f"\n{passed} passed, {failed} failed (out of {passed+failed})")
