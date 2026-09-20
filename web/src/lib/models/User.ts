import { Schema, model, models } from "mongoose";
import type { Model } from "mongoose";

export type UserRole = "buyer" | "seller";

export interface IUser {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller"], default: "buyer" },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) ?? model<IUser>("User", userSchema);