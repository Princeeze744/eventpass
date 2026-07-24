import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, adminKey } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { name: "asc" },
  });

  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Name", "Phone", "Category", "Party Size", "Pass ID", "Status", "Table", "Checked In", "Arrival Time"];
  const rows = guests.map((g) => [
    esc(g.name),
    esc(g.phone || ""),
    esc(g.tier),
    g.partySize,
    esc(g.passId),
    esc(g.status),
    esc(g.table),
    g.checkedIn ? "Yes" : "No",
    esc(g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : ""),
  ].join(","));

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-guests.csv"`,
    },
  });
}
