import { connectDB } from "@/lib/db";
import { createSessionToken, verifyPassword } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface LoginBody {
  identifier?: string;
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const identifier = (body.identifier ?? body.email ?? "").trim();
  const password = body.password ?? "";

  if (!identifier || !password) {
    return Response.json({ error: "Please enter your email or phone number and password." }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });
    if (!user || !verifyPassword(password, user.password)) {
      return Response.json({ error: "Incorrect email/phone or password." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("agri_session", createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

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
    return Response.json({ error: "Login failed. Please try again in a moment." }, { status: 500 });
  }
}