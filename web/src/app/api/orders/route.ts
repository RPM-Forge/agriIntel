import { Types } from "mongoose";
import { getSessionUser, isJsonRecord, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Order } from "@/lib/models/Order";
import { ProduceLot } from "@/lib/models/ProduceLot";
import { User } from "@/lib/models/User";

interface OrderBody {
  listingId?: unknown;
  quantity?: unknown;
  deliveryLocation?: unknown;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const field = user.role === "seller" ? "sellerId" : "buyerId";
    const orders = await Order.find({ [field]: user.id }).sort({ createdAt: -1 }).lean();
    return Response.json({
      data: orders.map(({ _id, listingId, buyerId, sellerId, ...order }) => ({
        id: String(_id),
        listingId: String(listingId),
        buyerId: String(buyerId),
        sellerId: String(sellerId),
        ...order,
      })),
    });
  } catch (error) {
    return serverErrorResponse("load orders", error);
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
  const body = payload as OrderBody;
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const quantity = Number(body.quantity);
  const deliveryLocation = typeof body.deliveryLocation === "string" ? body.deliveryLocation.trim() : "";
  if (!Types.ObjectId.isValid(listingId)) return Response.json({ error: "Choose a valid produce listing." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    return Response.json({ error: "Order quantity must be greater than zero." }, { status: 400 });
  }
  if (!deliveryLocation || deliveryLocation.length > 160) {
    return Response.json({ error: "Enter a delivery location (up to 160 characters)." }, { status: 400 });
  }

  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "buyer") return Response.json({ error: "Only buyers can place orders." }, { status: 403 });

    const lot = await ProduceLot.findOneAndUpdate(
      {
        _id: listingId,
        status: "available",
        availableQuantity: { $gte: quantity },
        sellerId: { $ne: user.id },
      },
      { $inc: { availableQuantity: -quantity } },
      { new: true },
    ).lean();
    if (!lot) {
      return Response.json(
        { error: "That listing is unavailable or does not have enough quantity. Refresh and try again." },
        { status: 409 },
      );
    }

    try {
      const seller = await User.findById(lot.sellerId).select("name").lean();
      if (!seller) throw new Error("Listing seller no longer exists.");
      if (lot.availableQuantity === 0) {
        await ProduceLot.updateOne({ _id: lot._id, status: "available" }, { $set: { status: "sold" } });
      }
      const order = await Order.create({
        listingId: lot._id,
        buyerId: user.id,
        sellerId: lot.sellerId,
        buyerName: user.name,
        sellerName: seller.name,
        crop: lot.crop,
        grade: lot.grade,
        quantity,
        unit: lot.unit,
        unitPrice: lot.pricePerUnit,
        amount: Math.round(quantity * lot.pricePerUnit * 100) / 100,
        deliveryLocation,
      });
      return Response.json(
        {
          data: {
            id: order.id,
            listingId: String(order.listingId),
            buyerId: String(order.buyerId),
            sellerId: String(order.sellerId),
            buyerName: order.buyerName,
            sellerName: order.sellerName,
            crop: order.crop,
            grade: order.grade,
            quantity: order.quantity,
            unit: order.unit,
            unitPrice: order.unitPrice,
            amount: order.amount,
            deliveryLocation: order.deliveryLocation,
            status: order.status,
            createdAt: order.createdAt,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      await ProduceLot.updateOne(
        { _id: lot._id, status: { $ne: "closed" } },
        { $inc: { availableQuantity: quantity }, $set: { status: "available" } },
      );
      throw error;
    }
  } catch (error) {
    return serverErrorResponse("place order", error);
  }
}
