import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { User } from "@/lib/models/User";
import type { DashboardUser } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("agri_session")?.value;
  const userId = token ? verifySessionToken(token) : null;

  if (!userId) {
    redirect("/auth?mode=login");
  }

  let user;
  try {
    await connectDB();
    user = await User.findById(userId).select("name email phone role verified").lean();
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/auth?mode=login");
  }

  const sessionUser: DashboardUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role === "seller" ? "seller" : "buyer",
    verified: Boolean(user.verified),
  };

  return <DashboardShell user={sessionUser}>{children}</DashboardShell>;
}