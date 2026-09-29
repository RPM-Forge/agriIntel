import { Types } from "mongoose";
import { getSessionUser, serverErrorResponse, unauthorizedResponse } from "@/lib/apiSession";
import { Order } from "@/lib/models/Order";
import { Payment } from "@/lib/models/Payment";
import { ProduceLot } from "@/lib/models/ProduceLot";
import { Shipment } from "@/lib/models/Shipment";
import type { DashboardActivity, DashboardSummary } from "@/lib/marketplace";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    const isSeller = user.role === "seller";
    const userId = new Types.ObjectId(user.id);
    const ownerFilter = isSeller ? { sellerId: userId } : { buyerId: userId };
    const activeOrderFilter = { ...ownerFilter, status: { $in: ["pending", "accepted"] as const } };
    const [lots, orders, payments, shipments, activeOrderCount, settledTotals, allLots, deliveriesPending] = await Promise.all([
      isSeller ? ProduceLot.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(8).lean() : Promise.resolve([]),
      Order.find(ownerFilter).sort({ updatedAt: -1 }).limit(10).lean(),
      Payment.find(ownerFilter).sort({ updatedAt: -1 }).limit(10).lean(),
      Shipment.find(ownerFilter).sort({ updatedAt: -1 }).limit(10).lean(),
      Order.countDocuments(activeOrderFilter),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { ...ownerFilter, status: "settled" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      isSeller ? ProduceLot.find({ sellerId: userId }).select("availableQuantity unit").lean() : Promise.resolve([]),
      Shipment.countDocuments({
        ...ownerFilter,
        status: { $nin: ["delivered", "cancelled"] },
      }),
    ]);

    const summary: DashboardSummary = {
      produceListings: allLots.length,
      produceQuintals: allLots.reduce((total, lot) => {
        const inQuintals = lot.unit === "kg" ? lot.availableQuantity / 100 : lot.unit === "tonne" ? lot.availableQuantity * 10 : lot.availableQuantity;
        return total + inQuintals;
      }, 0),
      earnings: isSeller ? settledTotals[0]?.total ?? 0 : 0,
      activeSales: isSeller ? activeOrderCount : 0,
      totalPaid: !isSeller ? settledTotals[0]?.total ?? 0 : 0,
      activeOrders: !isSeller ? activeOrderCount : 0,
      deliveriesPending: !isSeller ? deliveriesPending : 0,
      activity: [],
    };

    const activity: DashboardActivity[] = [
      ...lots.map((lot) => ({
        id: `lot-${String(lot._id)}`,
        kind: "listing" as const,
        title: `${lot.crop} listing`,
        detail: `${lot.availableQuantity} ${lot.unit} currently available`,
        status: lot.status,
        at: lot.createdAt.toISOString(),
      })),
      ...orders.map((order) => ({
        id: `order-${String(order._id)}`,
        kind: "order" as const,
        title: `${isSeller ? "Sale" : "Order"} · ${order.crop}`,
        detail: `${order.quantity} ${order.unit} · ₹${order.amount.toLocaleString("en-IN")}`,
        status: order.status,
        at: order.updatedAt.toISOString(),
      })),
      ...payments.map((payment) => ({
        id: `payment-${String(payment._id)}`,
        kind: "payment" as const,
        title: `Payment · ${payment.crop}`,
        detail: `₹${payment.amount.toLocaleString("en-IN")}`,
        status: payment.status,
        at: (payment.settledAt ?? payment.updatedAt).toISOString(),
      })),
      ...shipments.map((shipment) => ({
        id: `shipment-${String(shipment._id)}`,
        kind: "shipment" as const,
        title: `Delivery · ${shipment.crop}`,
        detail: `Tracking ${shipment.trackingReference}`,
        status: shipment.status,
        at: shipment.updatedAt.toISOString(),
      })),
    ]
      .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, 6);

    summary.activity = activity;
    return Response.json({ data: summary });
  } catch (error) {
    return serverErrorResponse("load dashboard summary", error);
  }
}
