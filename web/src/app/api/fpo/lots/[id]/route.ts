import { Types } from "mongoose";
import {
  FPO_GRADES,
  FPO_CROPS,
  getFpoCollections,
  isFpoUnit,
  publicLot,
  validFpoLocation,
  type FpoLotRecord,
} from "@/lib/fpo";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Quantity must be greater than zero." }, { status: 400 });
  }
  if (!isFpoUnit(unit)) return Response.json({ error: "Choose a valid quantity unit." }, { status: 400 });

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Lot not found." }, { status: 404 });
    const ownerId = new Types.ObjectId(user.id);
    const lotId = new Types.ObjectId(id);
    const { users } = await getFpoCollections();
    const owner = await users.findOne(
      { _id: ownerId, "lots._id": lotId },
      { projection: { lots: 1 } },
    );
    const existingLot = owner?.lots?.find((lot) => String(lot._id) === id) as FpoLotRecord | undefined;
    if (!existingLot) return Response.json({ error: "Lot not found." }, { status: 404 });
    if (existingLot.quantity !== existingLot.availableQuantity) {
      return Response.json({ error: "A lot with pool contributions cannot be edited." }, { status: 409 });
    }

    const updatedLot: FpoLotRecord = {
      ...existingLot,
      crop,
      grade,
      committee,
      state,
      district,
      quantity,
      availableQuantity: quantity,
      unit,
    };
    const result = await users.updateOne(
      {
        _id: ownerId,
        lots: {
          $elemMatch: {
            _id: lotId,
            quantity: existingLot.quantity,
            availableQuantity: existingLot.availableQuantity,
          },
        },
      },
      [{
        $set: {
          lots: {
            $map: {
              input: { $ifNull: ["$lots", []] },
              as: "lot",
              in: {
                $cond: [
                  { $eq: ["$$lot._id", lotId] },
                  { $mergeObjects: ["$$lot", updatedLot] },
                  "$$lot",
                ],
              },
            },
          },
        },
      }],
    );
    if (result.modifiedCount === 0) {
      return Response.json({ error: "This lot changed while you were editing it. Refresh and try again." }, { status: 409 });
    }

    return Response.json({ data: publicLot(updatedLot) });
  } catch (error) {
    return serverErrorResponse("update FPO lot", error);
  }
}
