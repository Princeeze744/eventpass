import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/match";

export async function POST(req: NextRequest) {
  const deadline = new Date(process.env.REGISTRATION_DEADLINE || "2100-01-01");
  if (new Date() > deadline) {
    return NextResponse.json(
      { error: "Registration has closed. Please contact the couple." },
      { status: 403 }
    );
  }

  const { name, phone } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  const cleanPhone = normPhone(phone);
  if (!cleanPhone || cleanPhone.length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const existing = await prisma.guest.findFirst({ where: { phone: cleanPhone } });
  if (existing) {
    if (existing.status === "declined") {
      return NextResponse.json(
        { error: "Your registration was not approved. Please contact the couple." },
        { status: 403 }
      );
    }
    return NextResponse.json({ passId: existing.passId });
  }

  let passId = generatePassId();
  while (await prisma.guest.findUnique({ where: { passId } })) {
    passId = generatePassId();
  }

  const guest = await prisma.guest.create({
    data: { passId, name: name.trim().replace(/\s+/g, " "), phone: cleanPhone },
  });
  return NextResponse.json({ passId: guest.passId });
}
