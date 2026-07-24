import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, adminKey, kind } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  let header: string[] = [];
  let rows: string[] = [];
  let name = "report";

  if (kind === "rsvp") {
    const guests = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, isVendor: false },
      orderBy: { name: "asc" },
    });
    name = "rsvp";
    header = ["Name", "Phone", "Category", "Party", "Response", "Status", "Pass ID", "Table"];
    rows = guests.map((g) => [
      esc(g.name), esc(g.phone || ""), esc(g.tier), g.partySize,
      esc(g.rsvpAnswer === "no" ? "Not attending" : "Attending"),
      esc(g.status), esc(g.passId), esc(g.table),
    ].join(","));
  }

  if (kind === "checkin") {
    const guests = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null },
      orderBy: [{ checkedIn: "desc" }, { checkedInAt: "asc" }],
    });
    name = "checkin";
    header = ["Name", "Type", "Party", "Table", "Checked In", "Arrival Time", "Pre-checked Online"];
    rows = guests.map((g) => [
      esc(g.name), esc(g.isVendor ? "Vendor" : g.tier), g.partySize, esc(g.table),
      g.checkedIn ? "Yes" : "No",
      esc(g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : ""),
      g.checkedInOnline ? "Yes" : "No",
    ].join(","));
  }

  if (kind === "gifts") {
    const gifts = await prisma.gift.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" } });
    name = "gifts";
    header = ["From", "Type", "Amount", "Item", "Note", "Thanked", "Recorded"];
    rows = gifts.map((g) => [
      esc(g.fromName), esc(g.giftType), g.amount || "", esc(g.item), esc(g.note),
      g.thanked ? "Yes" : "No", esc(new Date(g.createdAt).toLocaleDateString()),
    ].join(","));
  }

  if (kind === "seating") {
    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({ where: { eventId: event.id }, orderBy: [{ section: "asc" }, { position: "asc" }] }),
      prisma.guest.findMany({ where: { eventId: event.id, deletedAt: null } }),
    ]);
    name = "seating";
    header = ["Section", "Table", "Capacity", "Guest", "Party", "Category"];
    rows = tables.flatMap((t) => {
      const seated = guests.filter((g) => g.table === t.name);
      if (seated.length === 0) return [[esc(t.section), esc(t.name), t.capacity, esc(""), "", ""].join(",")];
      return seated.map((g) => [esc(t.section), esc(t.name), t.capacity, esc(g.name), g.partySize, esc(g.tier)].join(","));
    });
  }

  if (header.length === 0) return NextResponse.json({ error: "Unknown report" }, { status: 400 });

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-${name}.csv"`,
    },
  });
}
