import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Order } from "@/lib/models/Order";
import { ProduceLot } from "@/lib/models/ProduceLot";
import { Shipment } from "@/lib/models/Shipment";

type RequestedStatus = "accepted" | "rejected" | "cancelled" | "fulfilled";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const body = payload as { status?: unknown };
  const status = body.status;
  if (!["accepted", "rejected", "cancelled", "fulfilled"].includes(String(status))) {
    return Response.json({ error: "Choose a valid order status." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Order not found." }, { status: 404 });

    const sellerAction = user.role === "seller" && (status === "accepted" || status === "rejected");
    const sellerCompletion = user.role === "seller" && status === "fulfilled";
    const buyerCancellation = user.role === "buyer" && status === "cancelled";
    if (!sellerAction && !sellerCompletion && !buyerCancellation) {
      return Response.json({ error: "This order cannot be changed to that status." }, { status: 409 });
    }

    if (sellerCompletion) {
      const shipment = await Shipment.findOne({ orderId: id, sellerId: user.id }).select("status").lean();
      if (shipment?.status !== "delivered") {
        return Response.json({ error: "Mark the shipment delivered before completing this order." }, { status: 409 });
      }
    }

    const expectedStatus = sellerCompletion ? "accepted" : "pending";
    const ownerField = user.role === "seller" ? "sellerId" : "buyerId";
    const order = await Order.findOneAndUpdate(
      { _id: id, [ownerField]: user.id, status: expectedStatus },
      { $set: { status: status as RequestedStatus } },
      { new: true },
    );
    if (!order) return Response.json({ error: "Order not found or its status has already changed." }, { status: 409 });

    if (status === "rejected" || status === "cancelled") {
      await ProduceLot.updateOne(
        { _id: order.listingId, status: { $ne: "closed" } },
        { $inc: { availableQuantity: order.quantity }, $set: { status: "available" } },
      );
    }

    return Response.json({ data: { id: order.id, status: order.status } });
  } catch (error) {
    return serverErrorResponse("update order", error);
  }
}
