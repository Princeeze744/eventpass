import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

const ROLES = ["planner", "host", "guest", "vendor"];

export async function POST(req: NextRequest) {
  const { name, email, password, role, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const chosenRole = ROLES.includes(String(role)) ? String(role) : "planner";
  const clean = String(email).trim().toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email: clean } });
  if (exists) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: clean,
      phone: phone ? String(phone).trim() : null,
      role: chosenRole,
      passwordHash: await hashPassword(String(password)),
    },
  });

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
