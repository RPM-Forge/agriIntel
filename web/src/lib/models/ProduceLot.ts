import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IProduceLot {
  sellerId: Types.ObjectId;
  crop: string;
  grade: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  harvestDate?: Date;
  status: "available" | "sold" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const produceLotSchema = new Schema<IProduceLot>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    crop: { type: String, required: true, trim: true, maxlength: 80 },
    grade: { type: String, required: true, trim: true, maxlength: 40 },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["kg", "quintal", "tonne"] },
    pricePerUnit: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    harvestDate: { type: Date },
    status: { type: String, enum: ["available", "sold", "closed"], default: "available", index: true },
  },
  { timestamps: true },
);

produceLotSchema.index({ status: 1, createdAt: -1 });

export const ProduceLot: Model<IProduceLot> =
  (models.ProduceLot as Model<IProduceLot>) ?? model<IProduceLot>("ProduceLot", produceLotSchema);
