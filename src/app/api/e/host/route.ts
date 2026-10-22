import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { slug, adminKey } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Wrong access key." }, { status: 401 });
  }

  const [everyone, tables, eventDays] = await Promise.all([
    prisma.guest.findMany({ where: { eventId: event.id, deletedAt: null }, include: { days: true } }),
    prisma.seatTable.findMany({ where: { eventId: event.id }, orderBy: [{ section: "asc" }, { position: "asc" }] }),
    prisma.eventDay.findMany({ where: { eventId: event.id }, orderBy: { position: "asc" } }),
  ]);

  /* Vendors are crew, not guests. They are created with status
     "approved" and inherit the default rsvpAnswer, so left unfiltered
     they land inside "attending" and quietly inflate every headline
     number the host plans catering and seating from.

     They are split out here rather than dropped, so the host can still
     see them - just never blended into the guest count. */
  const guests = everyone.filter((g) => !g.isVendor);
  const vendorRows = everyone.filter((g) => g.isVendor);

  const attending = guests.filter((g) => g.status === "approved" && g.rsvpAnswer !== "no");
  const arrived = guests.filter((g) => g.checkedIn);

  return NextResponse.json({
    event: {
      title: event.title, tagline: event.tagline, hostName: event.hostName,
      eventDate: event.eventDate, eventDateISO: event.eventDateISO, eventTime: event.eventTime,
      venue: event.venue, address: event.address,
      dressCode: event.dressCode, colours: event.colours,
      giftNote: event.giftNote, bankDetails: event.bankDetails,
      programNote: event.programNote, menuNote: event.menuNote,
      livestream: event.livestream, slug: event.slug,
      approval: event.approval,
    },
    stats: {
      registered: guests.length,
      pending: guests.filter((g) => g.status === "pending").length,
      attending: attending.length,
      notAttending: guests.filter((g) => g.rsvpAnswer === "no").length,
      declined: guests.filter((g) => g.status === "declined").length,
      expectedHeads: attending.reduce((a, g) => a + g.partySize, 0),
      arrived: arrived.length,
      arrivedHeads: arrived.reduce((a, g) => a + g.partySize, 0),
      express: guests.filter((g) => g.checkedInOnline && !g.checkedIn).length,
      vips: attending.filter((g) => g.tier === "VIP").length,
      family: attending.filter((g) => g.tier === "Family").length,
      /* counted separately so crew are visible without distorting
         guest numbers */
      vendors: vendorRows.length,
      vendorsArrived: vendorRows.filter((g) => g.checkedIn).length,
    },
    days: eventDays.length > 1 ? eventDays.map((d) => {
      const onDay = attending.filter((g) => g.days.some((gd) => gd.dayId === d.id));
      const vendorsOnDay = vendorRows.filter((g) => g.days.some((gd) => gd.dayId === d.id));
      return {
        label: d.label,
        dateText: d.dateText,
        time: d.time,
        capacity: d.capacity,
        guests: onDay.length,
        heads: onDay.reduce((a, g) => a + g.partySize, 0),
        vendors: vendorsOnDay.length,
      };
    }) : [],
    tables: tables.map((t) => ({
      name: t.name, section: t.section, capacity: t.capacity,
      guests: attending.filter((g) => g.table === t.name).map((g) => ({ name: g.name, partySize: g.partySize, tier: g.tier })),
    })),
    recent: guests
      .filter((g) => g.checkedInAt)
      .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
      .slice(0, 8)
      .map((g) => ({
        name: g.name, tier: g.tier, table: g.table, partySize: g.partySize,
        time: new Date(g.checkedInAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })),
  });
}
