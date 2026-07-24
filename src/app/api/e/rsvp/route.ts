import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/ids";
import { getSessionOrganizerId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { slug, name, phone, partySize } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  if (event.approval !== "approved") {
    return NextResponse.json({ error: "Registration is not open for this event yet." }, { status: 403 });
  }

  if (event.deadline && new Date() > event.deadline) {
    return NextResponse.json({ error: "Registration has closed." }, { status: 403 });
  }

  if (!name || String(name).trim().length < 3) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  const cleanPhone = normPhone(phone);
  const sessionUserId = await getSessionOrganizerId();
  if (sessionUserId && cleanPhone) {
    await prisma.user.update({ where: { id: sessionUserId }, data: { phone: cleanPhone } }).catch(() => {});
  }
  if (!cleanPhone || cleanPhone.length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const existing = await prisma.guest.findFirst({
    where: { eventId: event.id, phone: cleanPhone },
  });
  if (existing) {
    if (existing.status === "declined") {
      return NextResponse.json({ error: "Your registration was not approved." }, { status: 403 });
    }
    if (existing.deletedAt) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: { deletedAt: null, status: event.approvalMode === "auto" ? "approved" : "pending" },
      });
    }
    return NextResponse.json({ passId: existing.passId });
  }

  if (event.capacity) {
    const count = await prisma.guest.count({ where: { eventId: event.id } });
    if (count >= event.capacity) {
      return NextResponse.json({ error: "Registration is full." }, { status: 403 });
    }
  }

  let passId = generatePassId();
  while (await prisma.guest.findUnique({ where: { passId } })) passId = generatePassId();

  const guest = await prisma.guest.create({
    data: {
      eventId: event.id,
      passId,
      name: String(name).trim().replace(/\s+/g, " "),
      phone: cleanPhone,
      partySize: Math.max(1, Math.min(10, Number(partySize) || 1)),
      status: event.approvalMode === "auto" ? "approved" : "pending",
    },
  });

  return NextResponse.json({ passId: guest.passId });
}
