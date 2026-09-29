import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export type ShipmentStatus =
  | "planned"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface IShipment {
  orderId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  crop: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  transporter: string;
  trackingReference: string;
  estimatedArrival?: Date;
  status: ShipmentStatus;
  history: Array<{ status: ShipmentStatus; at: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    crop: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    deliveryLocation: { type: String, required: true },
    transporter: { type: String, required: true, trim: true, maxlength: 100 },
    trackingReference: { type: String, required: true, trim: true, maxlength: 100 },
    estimatedArrival: { type: Date },
    status: {
      type: String,
      enum: ["planned", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled"],
      default: "planned",
      index: true,
    },
    history: {
      type: [{ status: { type: String, required: true }, at: { type: Date, required: true } }],
      default: [],
    },
  },
  { timestamps: true },
);

shipmentSchema.index({ sellerId: 1, createdAt: -1 });
shipmentSchema.index({ buyerId: 1, createdAt: -1 });

export const Shipment: Model<IShipment> =
  (models.Shipment as Model<IShipment>) ?? model<IShipment>("Shipment", shipmentSchema);
