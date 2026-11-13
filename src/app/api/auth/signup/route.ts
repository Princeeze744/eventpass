import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mailer";
import { rateLimit, callerIp, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const ROLES = ["planner", "host", "guest", "vendor"];

/* Creating an account writes a row and sends an email, both on
   somebody else's say-so. Unlimited, that is a way to fill the user
   table and spend the mail allowance at the same time, and to use our
   domain to deliver unwanted mail to addresses that never asked for
   it - which is how a sending domain gets a reputation it cannot
   easily lose. Five an hour from one address is far more than anyone
   signing up needs. */
export async function POST(req: NextRequest) {
  const gate = await rateLimit(`signup:${callerIp(req)}`, 5, 3600);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const { name, email, password, role, phone, serviceType } = await req.json().catch(() => ({}));

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const chosenRole = ROLES.includes(String(role)) ? String(role) : "planner";
  const clean = String(email).trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: clean } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: String(name).trim().slice(0, 120),
      email: clean,
      /* stored the same shape the rest of the platform matches on,
         rather than whatever was typed */
      phone: phone ? String(phone).replace(/\D/g, "").slice(-10) || null : null,
      role: chosenRole,
      serviceType: chosenRole === "vendor" ? String(serviceType || "").trim().slice(0, 120) : "",
      passwordHash: await hashPassword(String(password)),
    },
  });

  await sendWelcomeEmail(user.email, user.name, user.role);

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
