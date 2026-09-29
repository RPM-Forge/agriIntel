import { Types } from "mongoose";
import { getSessionUser, isDuplicateKeyError, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Order } from "@/lib/models/Order";
import { Shipment } from "@/lib/models/Shipment";

interface ShipmentBody {
  orderId?: unknown;
  transporter?: unknown;
  trackingReference?: unknown;
  estimatedArrival?: unknown;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const field = user.role === "seller" ? "sellerId" : "buyerId";
    const shipments = await Shipment.find({ [field]: user.id }).sort({ createdAt: -1 }).lean();
    return Response.json({
      data: shipments.map(({ _id, orderId, sellerId, buyerId, ...shipment }) => ({
        id: String(_id),
        orderId: String(orderId),
        sellerId: String(sellerId),
        buyerId: String(buyerId),
        ...shipment,
      })),
    });
  } catch (error) {
    return serverErrorResponse("load shipments", error);
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
  const body = payload as ShipmentBody;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const transporter = typeof body.transporter === "string" ? body.transporter.trim() : "";
  const trackingReference = typeof body.trackingReference === "string" ? body.trackingReference.trim() : "";
  const estimatedArrival =
    typeof body.estimatedArrival === "string" && body.estimatedArrival
      ? new Date(body.estimatedArrival)
      : undefined;

  if (!Types.ObjectId.isValid(orderId)) return Response.json({ error: "Choose a valid order." }, { status: 400 });
  if (!transporter || transporter.length > 100) {
    return Response.json({ error: "Enter a transporter name (up to 100 characters)." }, { status: 400 });
  }
  if (!trackingReference || trackingReference.length > 100) {
    return Response.json({ error: "Enter a tracking reference (up to 100 characters)." }, { status: 400 });
  }
  if (estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
    return Response.json({ error: "Choose a valid estimated arrival date." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "seller") {
      return Response.json({ error: "Only the seller can create a shipment record." }, { status: 403 });
    }

    const order = await Order.findOne({ _id: orderId, sellerId: user.id, status: "accepted" }).lean();
    if (!order) return Response.json({ error: "Only an accepted order can be shipped." }, { status: 409 });
    const existing = await Shipment.findOne({ orderId }).select("_id").lean();
    if (existing) return Response.json({ error: "A shipment is already assigned to this order." }, { status: 409 });

    const shipment = await Shipment.create({
      orderId: order._id,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      crop: order.crop,
      quantity: order.quantity,
      unit: order.unit,
      deliveryLocation: order.deliveryLocation,
      transporter,
      trackingReference,
      ...(estimatedArrival ? { estimatedArrival } : {}),
      status: "planned",
      history: [{ status: "planned", at: new Date() }],
    });
    return Response.json(
      {
        data: {
          id: shipment.id,
          orderId: String(shipment.orderId),
          sellerId: String(shipment.sellerId),
          buyerId: String(shipment.buyerId),
          crop: shipment.crop,
          quantity: shipment.quantity,
          unit: shipment.unit,
          deliveryLocation: shipment.deliveryLocation,
          transporter: shipment.transporter,
          trackingReference: shipment.trackingReference,
          estimatedArrival: shipment.estimatedArrival,
          status: shipment.status,
          history: shipment.history,
          createdAt: shipment.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) return Response.json({ error: "A shipment is already assigned to this order." }, { status: 409 });
    return serverErrorResponse("create shipment", error);
  }
}
