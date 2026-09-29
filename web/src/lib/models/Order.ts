import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export type OrderStatus = "pending" | "accepted" | "rejected" | "cancelled" | "fulfilled";

export interface IOrder {
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  buyerName: string;
  sellerName: string;
  crop: string;
  grade: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryLocation: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "ProduceLot", required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerName: { type: String, required: true, trim: true },
    sellerName: { type: String, required: true, trim: true },
    crop: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    deliveryLocation: { type: String, required: true, trim: true, maxlength: 160 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "fulfilled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

export const Order: Model<IOrder> = (models.Order as Model<IOrder>) ?? model<IOrder>("Order", orderSchema);
