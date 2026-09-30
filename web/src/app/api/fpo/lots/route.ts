import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import {
  getFpoCollections,
  isFpoUnit,
  publicLot,
  validFpoLocation,
  FPO_CROPS,
  FPO_GRADES,
  type FpoLotRecord,
} from "@/lib/fpo";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const { users } = await getFpoCollections();
    const document = await users.findOne(
      { _id: new Types.ObjectId(user.id) },
      { projection: { lots: 1 } },
    );
    const lots = (document?.lots ?? []).slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Response.json({ data: lots.map(publicLot) });
  } catch (error) {
    return serverErrorResponse("load FPO lots", error);
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });

  const crop = typeof payload.crop === "string" ? payload.crop.trim() : "";
  const grade = typeof payload.grade === "string" ? payload.grade.trim() : "";
  const committee = typeof payload.committee === "string" ? payload.committee.trim() : "";
  const state = typeof payload.state === "string" ? payload.state.trim() : "";
  const district = typeof payload.district === "string" ? payload.district.trim() : "";
  const quantity = Number(payload.quantity);
  const unit = payload.unit;

  if (!FPO_CROPS.includes(crop)) return Response.json({ error: "Choose a valid crop." }, { status: 400 });
  if (!FPO_GRADES.includes(grade as (typeof FPO_GRADES)[number])) return Response.json({ error: "Choose a valid crop grade." }, { status: 400 });
  if (!validFpoLocation(state, district, committee)) {
    return Response.json({ error: "Choose a valid state, district, and committee." }, { status: 400 });
  }
  if (committee.length > 100) return Response.json({ error: "Committee name must be 100 characters or fewer." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Quantity must be greater than zero." }, { status: 400 });
  }
  if (!isFpoUnit(unit)) return Response.json({ error: "Choose a valid quantity unit." }, { status: 400 });

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const { users } = await getFpoCollections();
    let lotNumber = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      lotNumber = `LOT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
      const exists = await users.findOne({ "lots.lotNumber": lotNumber }, { projection: { _id: 1 } });
      if (!exists) break;
      lotNumber = "";
    }
    if (!lotNumber) throw new Error("Could not generate a unique FPO lot number.");

    const lot: FpoLotRecord = {
      _id: new Types.ObjectId(),
      lotNumber,
      crop,
      grade,
      committee,
      state,
      district,
      quantity,
      availableQuantity: quantity,
      unit,
      createdAt: new Date(),
    };
    const result = await users.updateOne(
      { _id: new Types.ObjectId(user.id) },
      [{ $set: { lots: { $concatArrays: [{ $ifNull: ["$lots", []] }, [lot]] } } }],
    );
    if (result.matchedCount === 0) throw new Error("The seller account could not be found.");

    return Response.json({ data: publicLot(lot) }, { status: 201 });
  } catch (error) {
    return serverErrorResponse("create FPO lot", error);
  }
}
