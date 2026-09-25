import { connectDB } from "@/lib/db";
import { createSessionToken, hashPassword } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterBody {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

const ROLES = ["buyer", "seller"] as const;

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";
  const role = ROLES.includes(body.role as (typeof ROLES)[number]) ? (body.role as (typeof ROLES)[number]) : "buyer";

  if (!name) return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!phone) return Response.json({ error: "Please enter your phone number." }, { status: 400 });
  if (email && !EMAIL_RE.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    return Response.json(
      { error: "Password must be at least 8 characters and include both letters and numbers." },
      { status: 400 },
    );
  }
  if (password !== confirmPassword) return Response.json({ error: "Passwords do not match." }, { status: 400 });

  try {
    await connectDB();
    if (!email) await User.syncIndexes();

    const lookup: Array<{ email?: string; phone?: string }> = [{ phone }];
    if (email) lookup.push({ email });
    const existing = await User.findOne({ $or: lookup });
    if (email && existing?.email === email) {
      return Response.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }
    if (existing?.phone === phone) {
      return Response.json({ error: "An account with this phone number already exists. Please log in." }, { status: 409 });
    }

    const user = await User.create({
      name,
      ...(email ? { email } : {}),
      phone,
      password: hashPassword(password),
      role,
      verified: false,
    });

    const cookieStore = await cookies();
    cookieStore.set("agri_session", createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return Response.json(
      {
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
        },
      },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Sign-up failed. Please try again in a moment." }, { status: 500 });
  }
}