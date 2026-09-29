import { Types } from "mongoose";
import { getSessionUser, isDuplicateKeyError, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Order } from "@/lib/models/Order";
import { Payment } from "@/lib/models/Payment";
import type { PaymentMethod } from "@/lib/models/Payment";

interface PaymentBody {
  orderId?: unknown;
  method?: unknown;
  reference?: unknown;
}

const METHODS = ["bank_transfer", "upi", "cash", "other"] as const;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const field = user.role === "seller" ? "sellerId" : "buyerId";
    const payments = await Payment.find({ [field]: user.id }).sort({ createdAt: -1 }).lean();
    return Response.json({
      data: payments.map(({ _id, orderId, sellerId, buyerId, ...payment }) => ({
        id: String(_id),
        orderId: String(orderId),
        sellerId: String(sellerId),
        buyerId: String(buyerId),
        ...payment,
      })),
    });
  } catch (error) {
    return serverErrorResponse("load payment records", error);
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
  const body = payload as PaymentBody;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const method: PaymentMethod | undefined = METHODS.find(
    (option): option is PaymentMethod => option === body.method,
  );
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (!Types.ObjectId.isValid(orderId)) return Response.json({ error: "Choose a valid order." }, { status: 400 });
  if (!method) {
    return Response.json({ error: "Choose a valid payment method." }, { status: 400 });
  }
  if (reference.length > 100) return Response.json({ error: "Reference must be 100 characters or fewer." }, { status: 400 });

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "buyer") return Response.json({ error: "Only buyers can record a payment for an order." }, { status: 403 });

    const order = await Order.findOne({
      _id: orderId,
      buyerId: user.id,
      status: { $in: ["accepted", "fulfilled"] },
    }).lean();
    if (!order) return Response.json({ error: "Payments can only be recorded for accepted orders." }, { status: 409 });

    const existing = await Payment.findOne({ orderId }).select("_id").lean();
    if (existing) return Response.json({ error: "A payment record already exists for this order." }, { status: 409 });
    const payment = new Payment({
      orderId: order._id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      crop: order.crop,
      amount: order.amount,
      method,
      ...(reference ? { reference } : {}),
      status: "pending",
    });
    await payment.save();
    return Response.json(
      {
        data: {
          id: payment.id,
          orderId: String(payment.orderId),
          buyerId: String(payment.buyerId),
          sellerId: String(payment.sellerId),
          crop: payment.crop,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference,
          status: payment.status,
          createdAt: payment.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) return Response.json({ error: "A payment record already exists for this order." }, { status: 409 });
    return serverErrorResponse("create payment record", error);
  }
}
