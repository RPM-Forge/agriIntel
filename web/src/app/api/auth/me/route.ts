import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("agri_session")?.value;
  const userId = token ? verifySessionToken(token) : null;

  if (!userId) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("name email phone role verified");

    if (!user) {
      return Response.json({ error: "Session user no longer exists." }, { status: 401 });
    }

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch {
    return Response.json({ error: "Could not load your session." }, { status: 500 });
  }
}
