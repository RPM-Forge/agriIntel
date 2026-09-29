import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { ProduceLot } from "@/lib/models/ProduceLot";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const body = payload as { status?: unknown };
  if (body.status !== "closed") {
    return Response.json({ error: "Listings can only be closed." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "seller") return Response.json({ error: "Only sellers can close produce listings." }, { status: 403 });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Listing not found." }, { status: 404 });
    const lot = await ProduceLot.findOneAndUpdate(
      { _id: id, sellerId: user.id, status: { $ne: "closed" } },
      { $set: { status: "closed" } },
      { new: true },
    ).lean();
    if (!lot) return Response.json({ error: "Listing not found or already closed." }, { status: 404 });
    return Response.json({ data: { id: String(lot._id), status: lot.status } });
  } catch (error) {
    return serverErrorResponse("close produce listing", error);
  }
}
