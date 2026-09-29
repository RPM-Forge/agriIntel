import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export interface IBuyerRequirement {
  buyerId: Types.ObjectId;
  buyerName: string;
  crop: string;
  grade: string;
  quantity: number;
  unit: string;
  maxPricePerUnit?: number;
  location: string;
  neededBy?: Date;
  notes: string;
  status: "open" | "fulfilled" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const buyerRequirementSchema = new Schema<IBuyerRequirement>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerName: { type: String, required: true, trim: true, maxlength: 100 },
    crop: { type: String, required: true, trim: true, maxlength: 80 },
    grade: { type: String, required: true, trim: true, maxlength: 40 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["kg", "quintal", "tonne"] },
    maxPricePerUnit: { type: Number, min: 0 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    neededBy: { type: Date },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["open", "fulfilled", "closed"], default: "open", index: true },
  },
  { timestamps: true },
);

buyerRequirementSchema.index({ status: 1, createdAt: -1 });

export const BuyerRequirement: Model<IBuyerRequirement> =
  (models.BuyerRequirement as Model<IBuyerRequirement>) ??
  model<IBuyerRequirement>("BuyerRequirement", buyerRequirementSchema);
