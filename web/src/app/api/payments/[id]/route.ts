import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Payment } from "@/lib/models/Payment";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isJsonRecord(payload)) return Response.json({ error: "Invalid request body." }, { status: 400 });
  const body = payload as { status?: unknown };
  if (body.status !== "settled" && body.status !== "cancelled" && body.status !== "pending") {
    return Response.json({ error: "Choose a valid payment status." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return Response.json({ error: "Payment record not found." }, { status: 404 });
    const canSettle = user.role === "seller" && body.status === "settled";
    const canCancel = user.role === "buyer" && body.status === "cancelled";
    const canReopen = user.role === "buyer" && body.status === "pending";
    if (!canSettle && !canCancel && !canReopen) {
      return Response.json({ error: "This payment record cannot be changed to that status." }, { status: 409 });
    }

    const ownerField = canSettle ? "sellerId" : "buyerId";
    const expectedStatus = canReopen ? "cancelled" : "pending";
    const update = body.status === "settled"
      ? { $set: { status: "settled", settledAt: new Date() } }
      : body.status === "cancelled"
        ? { $set: { status: "cancelled" } }
        : { $set: { status: "pending" }, $unset: { settledAt: 1 } };
    const payment = await Payment.findOneAndUpdate(
      { _id: id, [ownerField]: user.id, status: expectedStatus },
      update,
      { new: true },
    ).lean();
    if (!payment) return Response.json({ error: "Payment record not found or its status has already changed." }, { status: 409 });
    return Response.json({ data: { id: String(payment._id), status: payment.status, settledAt: payment.settledAt } });
  } catch (error) {
    return serverErrorResponse("update payment record", error);
  }
}
