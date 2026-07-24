import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null },
    orderBy: { checkedInAt: "desc" },
  });

  const approved = guests.filter((g) => g.status === "approved" && g.rsvpAnswer !== "no");
  const declinedCount = guests.filter((g) => g.rsvpAnswer === "no").length;
  const arrived = guests.filter((g) => g.checkedIn);
  const expectedHeads = approved.reduce((a, g) => a + g.partySize, 0);
  const arrivedHeads = arrived.reduce((a, g) => a + g.partySize, 0);

  const hourly: Record<string, number> = {};
  arrived.forEach((g) => {
    if (!g.checkedInAt) return;
    const h = new Date(g.checkedInAt).getHours();
    const label = `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
    hourly[label] = (hourly[label] || 0) + g.partySize;
  });

  return NextResponse.json({
    event: { title: event.title, tagline: event.tagline, eventDate: event.eventDate, venue: event.venue, capacity: event.capacity },
    registered: guests.length,
    pending: guests.filter((g) => g.status === "pending").length,
    approved: approved.length,
    declined: declinedCount,
    expectedHeads,
    arrivedHeads,
    arrivedCount: arrived.length,
    express: guests.filter((g) => g.checkedInOnline && !g.checkedIn).length,
    hourly: Object.entries(hourly).map(([hour, count]) => ({ hour, count })),
    recent: arrived.slice(0, 10).map((g) => ({
      name: g.name,
      tier: g.tier,
      table: g.table,
      partySize: g.partySize,
      time: g.checkedInAt ? new Date(g.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    })),
  });
}
