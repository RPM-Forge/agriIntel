import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Shipment } from "@/lib/models/Shipment";
import { SHIPMENT_STATUSES } from "@/lib/marketplace";
import type { ShipmentStatus } from "@/lib/marketplace";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const body = payload as { status?: unknown };
  if (!SHIPMENT_STATUSES.includes(body.status as ShipmentStatus)) {
    return Response.json({ error: "Choose a valid shipment status." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "seller") return Response.json({ error: "Only the seller can update shipment progress." }, { status: 403 });

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Shipment not found." }, { status: 404 });
    const nextStatus = body.status as ShipmentStatus;
    const shipment = await Shipment.findOne({ _id: id, sellerId: user.id }).select("status").lean();
    if (!shipment) return Response.json({ error: "Shipment not found." }, { status: 404 });
    const currentIndex = SHIPMENT_STATUSES.indexOf(shipment.status);
    const nextIndex = SHIPMENT_STATUSES.indexOf(nextStatus);
    const allowed = nextStatus === "cancelled"
      ? shipment.status !== "delivered" && shipment.status !== "cancelled"
      : nextIndex === currentIndex + 1;
    if (!allowed) {
      return Response.json({ error: "Shipment progress must move forward one step at a time." }, { status: 409 });
    }

    const updated = await Shipment.findOneAndUpdate(
      { _id: id, sellerId: user.id, status: shipment.status },
      { $set: { status: nextStatus }, $push: { history: { status: nextStatus, at: new Date() } } },
      { new: true },
    ).lean();
    if (!updated) return Response.json({ error: "Shipment progress changed; refresh and try again." }, { status: 409 });
    return Response.json({ data: { id: String(updated._id), status: updated.status, history: updated.history } });
  } catch (error) {
    return serverErrorResponse("update shipment", error);
  }
}
