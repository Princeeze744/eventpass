import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, adminKey, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const canView = action === "list" && (adminKey === event.adminKey || body.usherKey === event.usherKey || body.publicView);
  const canEdit = adminKey === event.adminKey;

  if (!canView && !canEdit) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "list") {
    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({ where: { eventId: event.id }, orderBy: [{ section: "asc" }, { position: "asc" }] }),
      prisma.guest.findMany({
        where: { eventId: event.id, deletedAt: null, status: "approved", rsvpAnswer: { not: "no" } },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      event: { title: event.title },
      tables: tables.map((t) => ({
        id: t.id, name: t.name, section: t.section, capacity: t.capacity, note: t.note,
        seated: guests.filter((g) => g.table === t.name).reduce((a, g) => a + g.partySize, 0),
        guests: guests.filter((g) => g.table === t.name).map((g) => ({
          id: g.id, name: g.name, tier: g.tier, partySize: g.partySize, seat: g.seat, wristband: g.wristband,
        })),
      })),
      unseated: guests.filter((g) => !g.table || g.table === "TBA").map((g) => ({
        id: g.id, name: g.name, tier: g.tier, partySize: g.partySize,
      })),
    });
  }

  if (!canEdit) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "addTable") {
    const count = await prisma.seatTable.count({ where: { eventId: event.id } });
    await prisma.seatTable.create({
      data: {
        eventId: event.id,
        name: String(body.name || `Table ${count + 1}`).trim(),
        section: String(body.section || "Main").trim(),
        capacity: Math.max(1, Math.min(50, Number(body.capacity) || 10)),
        note: String(body.note || "").trim(),
        position: count,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "bulkTables") {
    const count = Math.max(1, Math.min(100, Number(body.count) || 10));
    const capacity = Math.max(1, Math.min(50, Number(body.capacity) || 10));
    const section = String(body.section || "Main").trim();
    const prefix = String(body.prefix || "Table").trim();
    const existing = await prisma.seatTable.count({ where: { eventId: event.id } });

    await prisma.seatTable.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        eventId: event.id,
        name: `${prefix} ${existing + i + 1}`,
        section, capacity, position: existing + i,
      })),
    });
    return NextResponse.json({ ok: true, added: count });
  }

  if (action === "updateTable") {
    await prisma.seatTable.update({
      where: { id: String(body.id) },
      data: {
        name: body.name ? String(body.name).trim() : undefined,
        section: body.section ? String(body.section).trim() : undefined,
        capacity: body.capacity ? Math.max(1, Math.min(50, Number(body.capacity))) : undefined,
        note: typeof body.note === "string" ? body.note.trim() : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "deleteTable") {
    const t = await prisma.seatTable.findUnique({ where: { id: String(body.id) } });
    if (t) {
      await prisma.guest.updateMany({ where: { eventId: event.id, table: t.name }, data: { table: "TBA", section: "", seat: "" } });
      await prisma.seatTable.delete({ where: { id: t.id } });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "seat") {
    const table = body.tableId ? await prisma.seatTable.findUnique({ where: { id: String(body.tableId) } }) : null;
    await prisma.guest.update({
      where: { id: String(body.guestId) },
      data: {
        table: table ? table.name : "TBA",
        section: table ? table.section : "",
        seat: typeof body.seat === "string" ? body.seat.trim() : undefined,
        wristband: typeof body.wristband === "string" ? body.wristband.trim() : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "autoSeat") {
    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({ where: { eventId: event.id }, orderBy: [{ section: "asc" }, { position: "asc" }] }),
      prisma.guest.findMany({
        where: { eventId: event.id, deletedAt: null, status: "approved", rsvpAnswer: { not: "no" }, OR: [{ table: "TBA" }, { table: "" }] },
        orderBy: [{ tier: "asc" }, { name: "asc" }],
      }),
    ]);

    if (tables.length === 0) return NextResponse.json({ error: "Create tables first." }, { status: 400 });

    const load: Record<string, number> = {};
    const seatedAll = await prisma.guest.findMany({ where: { eventId: event.id, deletedAt: null } });
    tables.forEach((t) => {
      load[t.id] = seatedAll.filter((g) => g.table === t.name).reduce((a, g) => a + g.partySize, 0);
    });

    let placed = 0;
    for (const g of guests) {
      const target = tables.find((t) => load[t.id] + g.partySize <= t.capacity);
      if (!target) continue;
      await prisma.guest.update({
        where: { id: g.id },
        data: { table: target.name, section: target.section },
      });
      load[target.id] += g.partySize;
      placed++;
    }

    return NextResponse.json({ ok: true, placed, left: guests.length - placed });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
