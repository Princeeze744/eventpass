import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, adminKey, action, guestId, status } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "status" && guestId) {
    if (!["pending", "approved", "declined"].includes(String(status))) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    await prisma.guest.update({ where: { id: String(guestId) }, data: { status: String(status) } });
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    event: { title: event.title, tagline: event.tagline },
    guests: guests.map((g) => ({
      id: g.id,
      passId: g.passId,
      name: g.name,
      phone: g.phone,
      partySize: g.partySize,
      table: g.table,
      status: g.status,
      checkedIn: g.checkedIn,
      checkedInOnline: g.checkedInOnline,
    })),
  });
}
