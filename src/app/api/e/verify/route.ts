import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, passId, usherKey } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ status: "invalid", message: "Event not found." }, { status: 404 });
  if (event.approval !== "approved") {
    return NextResponse.json({ status: "invalid", message: "Event not activated." }, { status: 403 });
  }
  if (usherKey !== event.usherKey) {
    return NextResponse.json({ status: "invalid", message: "Unauthorized." }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({
    where: { deletedAt: null, eventId: event.id, passId: String(passId || "").trim().toUpperCase() },
  });

  if (!guest || guest.status === "declined") {
    return NextResponse.json({ status: "invalid", message: "Not on the guest list." });
  }
  if (guest.status === "pending") {
    return NextResponse.json({
      status: "pending",
      message: "Not yet approved.",
      guest: { name: guest.name, tier: guest.tier, table: guest.table },
    });
  }
  if (guest.checkedIn) {
    return NextResponse.json({
      status: "duplicate",
      message: "Pass already used.",
      guest: {
        name: guest.name,
        tier: guest.tier,
        table: guest.table,
        checkedInAt: guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleTimeString() : undefined,
      },
    });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  return NextResponse.json({
    status: "valid",
    message: "Welcome.",
    preChecked: guest.checkedInOnline,
    guest: { name: guest.name, tier: guest.tier, table: guest.table, partySize: guest.partySize },
  });
}
