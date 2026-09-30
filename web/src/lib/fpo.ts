import mongoose, { Types } from "mongoose";
import type { Document } from "mongodb";
import { connectDB } from "@/lib/db";
import { MARKET_LOCATIONS } from "@/lib/marketOptions";

export { FPO_CROPS, FPO_GRADES, FPO_STATES, committeesForDistrict, districtsForState, validFpoLocation } from "@/lib/fpoOptions";

export type FpoUnit = "kg" | "quintal" | "tonne";

export interface FpoLotRecord {
  _id: Types.ObjectId;
  lotNumber: string;
  crop: string;
  grade: string;
  committee: string;
  state: string;
  district: string;
  quantity: number;
  availableQuantity: number;
  unit: FpoUnit;
  createdAt: Date;
}

interface UserLotsDocument extends Document {
  _id: Types.ObjectId;
  lots?: FpoLotRecord[];
}

export interface VerifiedFpoDocument extends Document {
  demoKey?: string;
  name: string;
  registrationNumber: string;
  contactName: string;
  phone: string;
  email: string;
  serviceAreas: Array<{ state: string; districts: string[] }>;
  crops: string[];
  grades: string[];
  active: boolean;
}

export interface PoolContribution {
  id: string;
  sellerId: string;
  lotId: string;
  lotNumber: string;
  quantity: number;
  joinedAt: Date;
}

export interface DemandPoolDocument extends Document {
  demoKey?: string;
  buyerName: string;
  crop: string;
  grade: string;
  state: string;
  districts: string[];
  quantity: number;
  filledQuantity: number;
  unit: FpoUnit;
  maxPricePerUnit?: number;
  deliveryDate?: string;
  status: "open" | "filled" | "closed";
  contributions: PoolContribution[];
}

function slug(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const DEMO_VERIFIED_FPOS: Omit<VerifiedFpoDocument, "_id">[] = Object.entries(MARKET_LOCATIONS).map(
  ([state, districts], index) => ({
    demoKey: `demo-state-${slug(state)}`,
    name: `${state} Farmer Producer Company (Demo)`,
    registrationNumber: `DEMO-FPO-${String(index + 1).padStart(3, "0")}`,
    contactName: "Demo Contact",
    phone: `+91-90000-${String(index + 1).padStart(5, "0")}`,
    email: `demo.fpo.${slug(state)}@example.com`,
    serviceAreas: [{ state, districts }],
    crops: ["Wheat", "Rice", "Potato", "Onion", "Tomato"],
    grades: ["Grade A", "Grade B", "Grade C", "FAQ"],
    active: true,
  }),
);

const DEMO_DEMAND_POOLS: Omit<DemandPoolDocument, "_id">[] = Object.entries(MARKET_LOCATIONS).map(
  ([state, districts]) => ({
    demoKey: `demo-state-${slug(state)}-potato-grade-a-tonne`,
    buyerName: `${state} Produce Buyer (Demo)`,
    crop: "Potato",
    grade: "Grade A",
    state,
    districts,
    quantity: 100_000,
    filledQuantity: 0,
    unit: "tonne",
    maxPricePerUnit: 22_000,
    deliveryDate: "2026-12-31",
    status: "open",
    contributions: [],
  }),
);

export async function getFpoCollections() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not available.");

  const collections = {
    users: db.collection<UserLotsDocument>("users"),
    verifiedFpos: db.collection<VerifiedFpoDocument>("verified_fpo"),
    demandPools: db.collection<DemandPoolDocument>("demand_pools"),
  };

  await Promise.all([
    collections.verifiedFpos.deleteMany({
      demoKey: { $in: ["demo-nashik-valley", "demo-deccan-fresh", "demo-kaveri-harvest"] },
    }),
    collections.demandPools.deleteMany({
      demoKey: {
        $in: [
          "demo-western-fresh-potato-grade-a",
          "demo-sahyadri-potato-grade-a",
          "demo-karnataka-produce-potato-grade-a",
          "demo-pan-india-potato-grade-a-tonne",
        ],
      },
    }),
    collections.demandPools.deleteMany({ demoKey: /^demo-pan-india-/ }),
  ]);

  await Promise.all([
    ...DEMO_VERIFIED_FPOS.map((fpo) =>
      collections.verifiedFpos.updateOne(
        { demoKey: fpo.demoKey },
        { $set: fpo },
        { upsert: true },
      ),
    ),
    ...DEMO_DEMAND_POOLS.map((pool) =>
      collections.demandPools.updateOne(
        { demoKey: pool.demoKey },
        { $setOnInsert: pool },
        { upsert: true },
      ),
    ),
  ]);

  return collections;
}

export function sameText(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}

export function poolMatchesLot(pool: DemandPoolDocument, lot: FpoLotRecord): boolean {
  return (
    pool.status === "open" &&
    pool.quantity > pool.filledQuantity &&
    pool.unit === lot.unit &&
    sameText(pool.crop, lot.crop) &&
    sameText(pool.grade, lot.grade) &&
    (pool.state === "*" || sameText(pool.state, lot.state)) &&
    pool.districts.some((district) => district === "*" || sameText(district, lot.district))
  );
}

export function verifiedFpoMatchesLot(fpo: VerifiedFpoDocument, lot: FpoLotRecord): boolean {
  return (
    fpo.active &&
    fpo.crops.some((crop) => sameText(crop, lot.crop)) &&
    fpo.grades.some((grade) => sameText(grade, lot.grade)) &&
    fpo.serviceAreas.some((area) =>
      (area.state === "*" || sameText(area.state, lot.state)) &&
      (area.districts.includes("*") ||
        area.districts.some((district) => sameText(district, lot.district)) ||
        (area.districts.length === 0 && (MARKET_LOCATIONS[area.state] ?? []).some((district) => sameText(district, lot.district)))),
    )
  );
}

export function stateDemoPoolForLot(lot: FpoLotRecord): Omit<DemandPoolDocument, "_id"> {
  const districts = MARKET_LOCATIONS[lot.state];
  if (!districts) throw new Error(`No supported districts found for ${lot.state}.`);

  return {
    demoKey: `demo-state-${slug(lot.state)}-${slug(lot.crop)}-${slug(lot.grade)}-${lot.unit}`,
    buyerName: `${lot.state} Produce Buyer (Demo)`,
    crop: lot.crop,
    grade: lot.grade,
    state: lot.state,
    districts,
    quantity: 100_000,
    filledQuantity: 0,
    unit: lot.unit,
    maxPricePerUnit: 22_000,
    deliveryDate: "2026-12-31",
    status: "open",
    contributions: [],
  };
}

export function isFpoUnit(value: unknown): value is FpoUnit {
  return value === "kg" || value === "quintal" || value === "tonne";
}

export function publicLot(lot: FpoLotRecord) {
  return {
    id: String(lot._id),
    lotNumber: lot.lotNumber,
    crop: lot.crop,
    grade: lot.grade,
    committee: lot.committee,
    state: lot.state,
    district: lot.district,
    quantity: lot.quantity,
    availableQuantity: lot.availableQuantity,
    unit: lot.unit,
    createdAt: lot.createdAt.toISOString(),
  };
}
