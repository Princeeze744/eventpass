import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, adminKey } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Wrong admin key." }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    event: { title: event.title, approvalMode: event.approvalMode },
    guests: guests.map((g) => ({
      id: g.id,
      passId: g.passId,
      name: g.name,
      phone: g.phone,
      partySize: g.partySize,
      tier: g.tier,
      table: g.table,
      status: g.status,
      checkedInOnline: g.checkedInOnline,
      checkedIn: g.checkedIn,
    })),
  });
}
