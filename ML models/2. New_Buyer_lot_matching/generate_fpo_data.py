"""
Generates a registry of REAL pre-existing FPOs (Farmer Producer Organizations)
— distinct from the ad-hoc "instant pooling" of independent farmers.

Produces:
  - fpo_registry.csv   — fpo_id, name, state, district, member_count
  - test_lots.csv       — REWRITTEN with a new 'fpo_id' column (empty for
                           independent farmers who aren't part of any FPO)

Punjab/Haryana get a heavier share of FPOs, matching their stronger
cooperative/APMC ecosystem (per earlier research in this project).
"""

import pandas as pd
import random

random.seed(7)

# State weighting: Punjab & Haryana get more FPOs (mature cooperative culture),
# other states get fewer but nonzero.
STATE_FPO_WEIGHTS = {
    "Punjab": 6, "Haryana": 5, "Maharashtra": 4, "Madhya Pradesh": 4,
    "Karnataka": 3, "Uttar Pradesh": 3, "Gujarat": 3, "Bihar": 2,
    "Rajasthan": 2, "Andhra Pradesh": 2, "Telangana": 2, "Tamil Nadu": 2,
    "West Bengal": 1, "Odisha": 1, "Chhattisgarh": 1,
}

from district_coords import DISTRICT_COORDS
STATE_DISTRICTS = {}
for (state, district) in DISTRICT_COORDS.keys():
    STATE_DISTRICTS.setdefault(state, []).append(district)

FPO_NAME_PREFIXES = ["Kisan", "Annapurna", "Bharat", "Jai Kisan", "Progressive",
                      "Unnati", "Sahyog", "Krishak", "Samriddhi", "Gramin"]
FPO_NAME_SUFFIXES = ["Farmer Producer Company", "FPO", "Agri Producer Co.",
                      "Growers Cooperative", "Kisan Producer Company"]

fpos = []
fpo_counter = 1
for state, weight in STATE_FPO_WEIGHTS.items():
    districts = STATE_DISTRICTS.get(state, [])
    if not districts:
        continue
    for _ in range(weight):
        district = random.choice(districts)
        name = f"{random.choice(FPO_NAME_PREFIXES)} {district} {random.choice(FPO_NAME_SUFFIXES)}"
        member_count = random.randint(40, 250)
        fpos.append({
            "fpo_id": f"FPO{fpo_counter:04d}",
            "name": name,
            "state": state,
            "district": district,
            "member_count": member_count,
        })
        fpo_counter += 1

fpo_df = pd.DataFrame(fpos)
fpo_df.to_csv("fpo_registry.csv", index=False)
print(f"Generated {len(fpo_df)} FPOs -> fpo_registry.csv")
print(fpo_df["state"].value_counts())

# ---------------- Assign farmers to FPOs ----------------
lots = pd.read_csv("test_lots.csv")

# Build farmer_id -> (state, district) from their most common lot location
farmer_location = lots.groupby("farmer_id").agg({"state": "first", "district": "first"}).reset_index()

# For each farmer, ~35% chance they belong to an FPO IF their state/district
# has one; assign them to an FPO in their own district if available, else
# their state, else none (stays independent).
fpo_by_district = {}
fpo_by_state = {}
for _, row in fpo_df.iterrows():
    fpo_by_district.setdefault((row["state"], row["district"]), []).append(row["fpo_id"])
    fpo_by_state.setdefault(row["state"], []).append(row["fpo_id"])

farmer_fpo_map = {}
for _, row in farmer_location.iterrows():
    if random.random() < 0.35:
        candidates = fpo_by_district.get((row["state"], row["district"]))
        if not candidates:
            candidates = fpo_by_state.get(row["state"])
        if candidates:
            farmer_fpo_map[row["farmer_id"]] = random.choice(candidates)

lots["fpo_id"] = lots["farmer_id"].map(farmer_fpo_map).fillna("")
lots.to_csv("test_lots.csv", index=False)

n_farmers_in_fpo = len(farmer_fpo_map)
n_farmers_total = len(farmer_location)
print(f"\n{n_farmers_in_fpo}/{n_farmers_total} farmers assigned to an FPO ({n_farmers_in_fpo/n_farmers_total*100:.0f}%)")
print(f"Lots with fpo_id set: {(lots['fpo_id'] != '').sum()} / {len(lots)}")
