"""Recreates the exact 'ITC Agri Procurement' scenario from the reference design."""
import pandas as pd
from datetime import datetime, timedelta
import importlib.util

spec = importlib.util.spec_from_file_location("pool_mod", "5_demand_pool.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

NOW = datetime.now()
pool = mod.create_demand_pool("ITC01", "ITC Agri Procurement (Indore Hub)", "Wheat", "Grade A",
                               2300, "Madhya Pradesh", "Indore", 20000, duration_hours=18, now=NOW)
contribs = pd.DataFrame(columns=mod.CONTRIB_COLUMNS)

pool, contribs, _ = mod.join_pool(pool, "Ramesh P.", "L1", 3200, 2310, contribs)
pool, contribs, _ = mod.join_pool(pool, "Sunita K.", "L2", 2100, 2305, contribs)
pool, contribs, you = mod.join_pool(pool, "You", "L3", 5500, 2315, contribs)

print(f"{pool['buyer_name']} — {pool['crop_type']} {pool['required_grade']} — Min bid ₹{pool['min_bid_price']}/q")
print(f"{pool['filled_quantity_kg']/1000:.1f} / {pool['target_quantity_kg']/1000:.0f} Tonnes Filled "
      f"({pool['filled_quantity_kg']/pool['target_quantity_kg']*100:.0f}%)")
print(f"Status: {pool['status'].upper()}  |  Your join: {you['message']}")
