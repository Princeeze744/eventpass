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
  // Multi-day: is this guest admitted today?
  const eventDays = await prisma.eventDay.findMany({ where: { eventId: event.id }, orderBy: { position: "asc" } });
  if (eventDays.length > 1) {
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayDay = eventDays.find((d) => d.dateISO === todayISO);
    if (todayDay) {
      const allowed = await prisma.guestDay.findFirst({ where: { guestId: guest.id, dayId: todayDay.id } });
      if (!allowed) {
        const theirs = await prisma.guestDay.findMany({ where: { guestId: guest.id }, include: { day: true } });
        const labels = theirs.sort((a, b) => a.day.position - b.day.position).map((x) => x.day.label).join(", ");
        return NextResponse.json({
          status: "wrongday",
          message: `Not registered for ${todayDay.label}.`,
          guest: { name: guest.name, tier: guest.tier, table: guest.table, validFor: labels || "no days selected" },
        });
      }
    }
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
