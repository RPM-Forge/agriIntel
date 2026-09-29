import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export type PaymentMethod = "bank_transfer" | "upi" | "cash" | "other";
export type PaymentStatus = "pending" | "settled" | "cancelled";

export interface IPayment {
  orderId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  crop: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    crop: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bank_transfer", "upi", "cash", "other"], required: true },
    reference: { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ["pending", "settled", "cancelled"], default: "pending", index: true },
    settledAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ sellerId: 1, createdAt: -1 });
paymentSchema.index({ buyerId: 1, createdAt: -1 });

export const Payment: Model<IPayment> = (models.Payment as Model<IPayment>) ?? model<IPayment>("Payment", paymentSchema);
