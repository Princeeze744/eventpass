import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTableEmail } from "@/lib/mailer";
import { canManageEvent } from "@/lib/eventAccess";

/* Vendors are crew, not guests. They are created approved with the
   default rsvpAnswer, so any query filtering only on status and RSVP
   picks them up. */
const GUESTS_ONLY = { isVendor: false } as const;

/* ------------------------------------------------------------------
   Table names must be unique within an event.

   A guest records their table as TEXT - "Table 35" - and is matched to
   a table by that string. Two tables sharing a name are therefore
   indistinguishable: both show the same guests, and renaming either
   one drags the other's guests along with it.

   Names used to be generated from a COUNT of existing tables, so
   deleting a table made the count fall behind the highest number in
   use and the next table created was handed a name already taken.
   Counting from the highest number actually in use, then stepping past
   anything taken, cannot collide.
------------------------------------------------------------------ */
async function freeTableName(eventId: string, prefix: string, taken?: Set<string>) {
  const rows = await prisma.seatTable.findMany({ where: { eventId }, select: { name: true } });
  const used = taken ?? new Set<string>();
  for (const r of rows) used.add(r.name);

  let max = 0;
  for (const name of used) {
    const m = String(name).match(/^(.*?)\s+(\d+)$/);
    if (m && m[1].toLowerCase() === prefix.toLowerCase()) max = Math.max(max, Number(m[2]));
  }

  let n = max + 1;
  while (used.has(`${prefix} ${n}`)) n++;
  const out = `${prefix} ${n}`;
  used.add(out);
  return out;
}

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
        where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", rsvpAnswer: { not: "no" } },
        orderBy: { name: "asc" },
      }),
    ]);

    /* surfaced so the host can see a clash rather than wonder why two
       tables show the same people */
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const t of tables) {
      if (seen.has(t.name)) duplicates.add(t.name);
      seen.add(t.name);
    }

    const names = new Set(tables.map((t) => t.name));

    return NextResponse.json({
      event: { title: event.title },
      duplicates: Array.from(duplicates),
      tables: tables.map((t) => ({
        id: t.id, name: t.name, section: t.section, capacity: t.capacity, note: t.note,
        duplicate: duplicates.has(t.name),
        seated: guests.filter((g) => g.table === t.name).reduce((a, g) => a + g.partySize, 0),
        guests: guests.filter((g) => g.table === t.name).map((g) => ({
          id: g.id, name: g.name, tier: g.tier, partySize: g.partySize, seat: g.seat, wristband: g.wristband,
        })),
      })),
      /* a guest whose table was deleted or renamed away still holds the
         old text - without this they are invisible on the plan */
      unseated: guests
        .filter((g) => !g.table || g.table === "TBA" || !names.has(g.table))
        .map((g) => ({
          id: g.id, name: g.name, tier: g.tier, partySize: g.partySize,
          lost: Boolean(g.table && g.table !== "TBA" && !names.has(g.table)) ? g.table : "",
        })),
    });
  }

  if (!canEdit) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "addTable") {
    const section = String(body.section || "Main").trim();
    const asked = String(body.name || "").trim();

    let name: string;
    if (asked) {
      const clash = await prisma.seatTable.findFirst({ where: { eventId: event.id, name: asked } });
      if (clash) {
        return NextResponse.json({ error: `A table called "${asked}" already exists.` }, { status: 400 });
      }
      name = asked;
    } else {
      name = await freeTableName(event.id, "Table");
    }

    const count = await prisma.seatTable.count({ where: { eventId: event.id } });
    await prisma.seatTable.create({
      data: {
        eventId: event.id,
        name,
        section,
        capacity: Math.max(1, Math.min(50, Number(body.capacity) || 10)),
        note: String(body.note || "").trim(),
        position: count,
      },
    });
    return NextResponse.json({ ok: true, name });
  }

  if (action === "bulkTables") {
    const count = Math.max(1, Math.min(100, Number(body.count) || 10));
    const capacity = Math.max(1, Math.min(50, Number(body.capacity) || 10));
    const section = String(body.section || "Main").trim();
    const prefix = String(body.prefix || "Table").trim();
    const existing = await prisma.seatTable.count({ where: { eventId: event.id } });

    /* one shared "taken" set so the batch does not collide with itself */
    const taken = new Set<string>();
    const names: string[] = [];
    for (let i = 0; i < count; i++) names.push(await freeTableName(event.id, prefix, taken));

    await prisma.seatTable.createMany({
      data: names.map((name, i) => ({
        eventId: event.id,
        name,
        section, capacity, position: existing + i,
      })),
    });
    return NextResponse.json({ ok: true, added: count, first: names[0], last: names[names.length - 1] });
  }

  if (action === "updateTable") {
    /* A guest stores their table as text, matched against the table's
       name, so renaming the table alone orphans everyone sitting at it.
       The rename carries them across in the same breath. */
    const before = await prisma.seatTable.findUnique({ where: { id: String(body.id) } });
    if (!before) return NextResponse.json({ error: "Table not found." }, { status: 404 });

    const nextName = body.name ? String(body.name).trim() : undefined;
    const nextSection = body.section ? String(body.section).trim() : undefined;

    if (nextName && nextName !== before.name) {
      const clash = await prisma.seatTable.findFirst({
        where: { eventId: event.id, name: nextName, NOT: { id: before.id } },
      });
      if (clash) {
        return NextResponse.json(
          { error: `Another table is already called "${nextName}".` },
          { status: 400 }
        );
      }
    }

    /* If this table's old name was shared with another table, moving
       guests by name would move the other table's guests too. Refuse
       rather than scramble two tables at once. */
    if (nextName && nextName !== before.name) {
      const sharing = await prisma.seatTable.count({
        where: { eventId: event.id, name: before.name, NOT: { id: before.id } },
      });
      if (sharing) {
        return NextResponse.json(
          { error: `Another table is also called "${before.name}". Give one of them a different name first.` },
          { status: 400 }
        );
      }
    }

    await prisma.seatTable.update({
      where: { id: before.id },
      data: {
        name: nextName,
        section: nextSection,
        capacity: body.capacity ? Math.max(1, Math.min(50, Number(body.capacity))) : undefined,
        note: typeof body.note === "string" ? body.note.trim() : undefined,
      },
    });

    const moved: Record<string, string> = {};
    if (nextName && nextName !== before.name) moved.table = nextName;
    if (nextSection && nextSection !== before.section) moved.section = nextSection;

    let reseated = 0;
    if (Object.keys(moved).length) {
      const r = await prisma.guest.updateMany({
        where: { eventId: event.id, deletedAt: null, table: before.name },
        data: moved,
      });
      reseated = r.count;
    }

    return NextResponse.json({ ok: true, reseated });
  }

  if (action === "deleteTable") {
    const t = await prisma.seatTable.findUnique({ where: { id: String(body.id) } });
    if (t) {
      /* only clear guests if no other table still carries this name */
      const sharing = await prisma.seatTable.count({
        where: { eventId: event.id, name: t.name, NOT: { id: t.id } },
      });
      if (!sharing) {
        await prisma.guest.updateMany({ where: { eventId: event.id, table: t.name }, data: { table: "TBA", section: "", seat: "" } });
      }
      await prisma.seatTable.delete({ where: { id: t.id } });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "notifyAll") {
    const seated = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", email: { not: null }, NOT: { table: "TBA" } },
    });
    let sent = 0;
    for (const g of seated) {
      await sendTableEmail({
        to: g.email as string, guestName: g.name, eventTitle: event.title, tagline: event.tagline,
        slug: event.slug, passId: g.passId, section: g.section, table: g.table, seat: g.seat,
        eventDate: event.eventDate, eventDateISO: event.eventDateISO, eventTime: event.eventTime,
        venue: event.venue, address: event.address,
      });
      sent++;
    }
    return NextResponse.json({ ok: true, sent });
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

    /* Seating is iterative - a host shuffles people for an hour before
       the plan settles. Emailing on each move means five emails of which
       the first four are wrong, so a seat change is silent unless the
       caller explicitly asks. "Notify seated" is the deliberate moment. */
    if (body.notify === true) {
      const seatedGuest = await prisma.guest.findUnique({ where: { id: String(body.guestId) } });
      if (seatedGuest && seatedGuest.email && !seatedGuest.isVendor && body.tableId) {
        await sendTableEmail({
          to: seatedGuest.email, guestName: seatedGuest.name, eventTitle: event.title, tagline: event.tagline,
          slug: event.slug, passId: seatedGuest.passId, section: seatedGuest.section,
          table: seatedGuest.table, seat: seatedGuest.seat,
          eventDate: event.eventDate, eventDateISO: event.eventDateISO, eventTime: event.eventTime,
          venue: event.venue, address: event.address,
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "autoSeat") {
    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({ where: { eventId: event.id }, orderBy: [{ section: "asc" }, { position: "asc" }] }),
      prisma.guest.findMany({
        where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", rsvpAnswer: { not: "no" }, OR: [{ table: "TBA" }, { table: "" }] },
        orderBy: [{ tier: "asc" }, { name: "asc" }],
      }),
    ]);

    if (tables.length === 0) return NextResponse.json({ error: "Create tables first." }, { status: 400 });

    const load: Record<string, number> = {};
    const seatedAll = await prisma.guest.findMany({ where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY } });
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
