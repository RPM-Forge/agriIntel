# FPO marketplace demo data

Demo data is defined in `src/lib/fpo.ts` and upserted into MongoDB automatically when the FPO marketplace APIs are first used:

- one demo verified FPO for every state/territory in `MARKET_LOCATIONS` goes into `verified_fpo`. Each FPO covers every district offered for that state in the location dropdown.
- one Potato / Grade A / tonne demo pool for each state/territory goes into `demand_pools`, also covering every dropdown district in that state.
- when a lot is searched for pool matches, an open state-specific pool is ensured for that lot's state, crop, grade, and unit. This lets other crop, grade, and unit selections find a match too, and creates a fresh demo pool if that pool has filled.

No manual import or extra seed command is required. The JSON files contain a Maharashtra example for optional MongoDB import/inspection; they are not the complete state dataset. Retain their `demoKey` values if importing so the automatic seeder recognizes those records. All contact details and buyer names are fictional.

Create or edit an FPO lot from `/dashboard/fpo`; each lot is stored as an object in the signed-in user's `users.lots` array. Commodity, state, district, and grade choices reuse `COMMODITIES`, `MARKET_LOCATIONS`, and `GRADES` from `src/lib/marketOptions.ts`, the same source used by the landing-page rate checker. Committee choices are simple district-based demo options because the landing page has no committee dataset. Pool contributions update both the pool's filled quantity and the contributing lot's available quantity. Pool capacity is reserved atomically, so concurrent contributions cannot overfill a pool. Any authenticated account can use this prototype flow; signup and user models are unchanged.
