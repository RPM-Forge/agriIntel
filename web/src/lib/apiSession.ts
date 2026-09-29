import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { User } from "@/lib/models/User";
import type { Role } from "@/lib/dashboard";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("agri_session")?.value;
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) return null;

  await connectDB();
  const user = await User.findById(userId).select("name role").lean();
  if (!user) return null;

  return { id: String(user._id), role: user.role === "seller" ? "seller" : "buyer", name: user.name };
}

export function unauthorizedResponse() {
  return Response.json({ error: "Please sign in to continue." }, { status: 401 });
}

export function serverErrorResponse(action: string, error: unknown) {
  console.error(`${action} failed:`, error);
  return Response.json({ error: `Could not ${action}. Please try again.` }, { status: 500 });
}

export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isDuplicateKeyError(error: unknown): boolean {
  return isJsonRecord(error) && error.code === 11000;
}
