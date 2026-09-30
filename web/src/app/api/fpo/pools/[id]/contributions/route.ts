import { Types } from "mongoose";
import { getFpoCollections, poolMatchesLot } from "@/lib/fpo";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const lotId = typeof payload.lotId === "string" ? payload.lotId : "";
  const quantity = Number(payload.quantity);
  if (!Types.ObjectId.isValid(lotId)) return Response.json({ error: "Choose a valid lot." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Contribution quantity must be greater than zero." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Demand pool not found." }, { status: 404 });
    const { users, demandPools } = await getFpoCollections();
    const lotObjectId = new Types.ObjectId(lotId);
    const poolObjectId = new Types.ObjectId(id);
    const seller = await users.findOne(
      { _id: new Types.ObjectId(user.id), "lots._id": lotObjectId },
      { projection: { lots: 1 } },
    );
    const lot = seller?.lots?.find((candidate) => String(candidate._id) === lotId);
    if (!lot) return Response.json({ error: "Lot not found." }, { status: 404 });
    if (lot.availableQuantity < quantity) {
      return Response.json({ error: `This lot has only ${lot.availableQuantity} ${lot.unit} available.` }, { status: 409 });
    }

    const pool = await demandPools.findOne({ _id: poolObjectId });
    if (!pool || !poolMatchesLot(pool, lot)) {
      return Response.json({ error: "This lot does not match an open demand pool." }, { status: 409 });
    }
    if (quantity > pool.quantity - pool.filledQuantity) {
      return Response.json(
        { error: `Only ${pool.quantity - pool.filledQuantity} ${pool.unit} remain in this pool.` },
        { status: 409 },
      );
    }

    const contributionId = new Types.ObjectId().toString();
    const joinedAt = new Date();
    const contribution = {
      id: contributionId,
      sellerId: user.id,
      lotId,
      lotNumber: lot.lotNumber,
      quantity,
      joinedAt,
    };
    const reservation = await demandPools.updateOne(
      {
        _id: poolObjectId,
        status: "open",
        filledQuantity: { $lte: pool.quantity - quantity },
      },
      [{
        $set: {
          filledQuantity: { $add: [{ $ifNull: ["$filledQuantity", 0] }, quantity] },
          status: {
            $cond: [
              { $gte: [{ $add: [{ $ifNull: ["$filledQuantity", 0] }, quantity] }, "$quantity"] },
              "filled",
              "$status",
            ],
          },
          contributions: { $concatArrays: [{ $ifNull: ["$contributions", []] }, [contribution]] },
        },
      }],
    );
    if (reservation.modifiedCount === 0) {
      return Response.json({ error: "The pool filled while you were contributing. Refresh and try again." }, { status: 409 });
    }

    try {
      const lotUpdate = await users.updateOne(
        {
          _id: new Types.ObjectId(user.id),
          lots: { $elemMatch: { _id: lotObjectId, availableQuantity: { $gte: quantity } } },
        },
        { $inc: { "lots.$.availableQuantity": -quantity } },
      );
      if (lotUpdate.modifiedCount === 0) {
        await demandPools.updateOne(
          { _id: poolObjectId },
          [{
            $set: {
              filledQuantity: { $subtract: ["$filledQuantity", quantity] },
              status: "open",
              contributions: {
                $filter: {
                  input: { $ifNull: ["$contributions", []] },
                  as: "contribution",
                  cond: { $ne: ["$$contribution.id", contributionId] },
                },
              },
            },
          }],
        );
        return Response.json({ error: "Your lot quantity changed. Refresh and try again." }, { status: 409 });
      }
    } catch (error) {
      await demandPools.updateOne(
        { _id: poolObjectId },
        [{
          $set: {
            filledQuantity: { $subtract: ["$filledQuantity", quantity] },
            status: "open",
            contributions: {
              $filter: {
                input: { $ifNull: ["$contributions", []] },
                as: "contribution",
                cond: { $ne: ["$$contribution.id", contributionId] },
              },
            },
          },
        }],
      );
      throw error;
    }

    return Response.json({
      data: {
        contributionId,
        lotId,
        lotNumber: lot.lotNumber,
        quantity,
        lotAvailableQuantity: lot.availableQuantity - quantity,
        poolFilledQuantity: pool.filledQuantity + quantity,
        poolQuantity: pool.quantity,
      },
    }, { status: 201 });
  } catch (error) {
    return serverErrorResponse("contribute to demand pool", error);
  }
}
