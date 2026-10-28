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

/* ------------------------------------------------------------------
   Groups.

   Real events are not seated guest by guest - they are seated by
   affiliation. One table block for the bank colleagues, another for
   the family, another for the school set. The host knows who belongs
   to which group; the seat inside the group rarely matters.

   A guest's GROUP lives in `section`. Seating has always stamped the
   table's section onto the guest, so for anyone already seated the
   field is their group already. The import can now set it in advance,
   which is what lets a guest be seated the moment they say yes.
------------------------------------------------------------------ */
type TableRow = { id: string; name: string; section: string; capacity: number };
type GuestRow = { id: string; name: string; section: string; table: string; partySize: number };

const groupOf = (g: { section: string }) => String(g.section || "").trim();

function tableLoad(tables: TableRow[], guests: GuestRow[]) {
  const load: Record<string, number> = {};
  for (const t of tables) load[t.id] = 0;
  for (const g of guests) {
    const t = tables.find((x) => x.name === g.table);
    if (t) load[t.id] += g.partySize;
  }
  return load;
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
          /* their intended group, if the list carried one - this is what
             lets the plan seat them without being told twice */
          group: groupOf(g),
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

  /* ----------------------------------------------------------------
     seatMany - put a handful of people into one group, or one table,
     in a single action.

     The host ticks the three Standard Chartered colleagues who just
     said yes, picks that group, and they land on whichever of its
     tables has room. Previously this was three separate dialogs and
     the host had to remember which of the five bank tables was full.
  ---------------------------------------------------------------- */
  if (action === "seatMany") {
    const ids = (Array.isArray(body.guestIds) ? body.guestIds : []).map(String).filter(Boolean);
    if (!ids.length) return NextResponse.json({ error: "Nobody selected." }, { status: 400 });

    const section = String(body.section || "").trim();
    const tableId = String(body.tableId || "").trim();
    if (!section && !tableId) return NextResponse.json({ error: "Pick a group or a table." }, { status: 400 });

    const tables = await prisma.seatTable.findMany({
      where: { eventId: event.id },
      orderBy: [{ section: "asc" }, { position: "asc" }],
      select: { id: true, name: true, section: true, capacity: true },
    });

    const all = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY },
      select: { id: true, name: true, section: true, table: true, partySize: true },
    });

    const load = tableLoad(tables, all);

    const chosen = tableId
      ? tables.filter((t) => t.id === tableId)
      : tables.filter((t) => t.section === section);

    if (!chosen.length) {
      return NextResponse.json(
        { error: section ? `There are no tables in "${section}" yet. Add some first.` : "Table not found." },
        { status: 400 }
      );
    }

    /* biggest parties first, so a family of four is not left stranded
       after the singles have eaten the gaps */
    const picked = all
      .filter((g) => ids.includes(g.id))
      .sort((a, b) => b.partySize - a.partySize || a.name.localeCompare(b.name));

    let placed = 0;
    const left: string[] = [];

    for (const g of picked) {
      const target = chosen.find((t) => load[t.id] + g.partySize <= t.capacity);
      if (!target) { left.push(g.name); continue; }
      await prisma.guest.update({
        where: { id: g.id },
        data: { table: target.name, section: target.section },
      });
      load[target.id] += g.partySize;
      placed++;
    }

    return NextResponse.json({ ok: true, placed, left: left.length, leftNames: left.slice(0, 6) });
  }

  /* ----------------------------------------------------------------
     setGroup - record which group people belong to without seating
     them yet. Useful when the host knows the affiliation but has not
     decided the table block, and it is what makes "Plan it for me"
     able to place them afterwards.
  ---------------------------------------------------------------- */
  if (action === "setGroup") {
    const ids = (Array.isArray(body.guestIds) ? body.guestIds : []).map(String).filter(Boolean);
    const section = String(body.section || "").trim();
    if (!ids.length) return NextResponse.json({ error: "Nobody selected." }, { status: 400 });

    const r = await prisma.guest.updateMany({
      where: { eventId: event.id, id: { in: ids }, deletedAt: null, ...GUESTS_ONLY },
      data: { section },
    });
    return NextResponse.json({ ok: true, grouped: r.count, section });
  }

  /* ----------------------------------------------------------------
     tablesForGroup - "this group has 48 people, give it tables".

     Works out how many are still needed on top of the room the group
     already has, and creates exactly that many.
  ---------------------------------------------------------------- */
  if (action === "tablesForGroup") {
    const section = String(body.section || "").trim();
    if (!section) return NextResponse.json({ error: "Which group?" }, { status: 400 });
    const capacity = Math.max(1, Math.min(50, Number(body.capacity) || 10));

    const tables = await prisma.seatTable.findMany({
      where: { eventId: event.id },
      orderBy: [{ section: "asc" }, { position: "asc" }],
      select: { id: true, name: true, section: true, capacity: true },
    });

    const guests = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", rsvpAnswer: { not: "no" } },
      select: { id: true, name: true, section: true, table: true, partySize: true },
    });

    const names = new Set(tables.map((t) => t.name));
    const load = tableLoad(tables, guests);

    const mine = tables.filter((t) => t.section === section);
    const room = mine.reduce((a, t) => a + Math.max(0, t.capacity - load[t.id]), 0);

    const waitingSeats = guests
      .filter((g) => (!g.table || g.table === "TBA" || !names.has(g.table)) && groupOf(g) === section)
      .reduce((a, g) => a + g.partySize, 0);

    const short = Math.max(0, waitingSeats - room);
    const need = Math.ceil(short / capacity);

    if (!need) {
      return NextResponse.json({ ok: true, added: 0, note: `"${section}" already has room for everyone waiting.` });
    }

    const prefix = String(body.prefix || "Table").trim();
    const existing = tables.length;
    const taken = new Set<string>();
    const newNames: string[] = [];
    for (let i = 0; i < need; i++) newNames.push(await freeTableName(event.id, prefix, taken));

    await prisma.seatTable.createMany({
      data: newNames.map((name, i) => ({
        eventId: event.id, name, section, capacity, position: existing + i,
      })),
    });

    return NextResponse.json({ ok: true, added: need, first: newNames[0], last: newNames[newNames.length - 1] });
  }

  /* ----------------------------------------------------------------
     planSeating - read the whole event and seat everyone into their
     own group, keeping parties whole.

     Returns the plan WITHOUT changing anything unless apply is true,
     because a host will not trust a button that rearranges 345 people
     without showing its work first.
  ---------------------------------------------------------------- */
  if (action === "planSeating") {
    const apply = body.apply === true;

    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({
        where: { eventId: event.id },
        orderBy: [{ section: "asc" }, { position: "asc" }],
        select: { id: true, name: true, section: true, capacity: true },
      }),
      prisma.guest.findMany({
        where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", rsvpAnswer: { not: "no" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, section: true, table: true, partySize: true },
      }),
    ]);

    if (!tables.length) return NextResponse.json({ error: "Create tables first." }, { status: 400 });

    const names = new Set(tables.map((t) => t.name));
    const isSeated = (g: GuestRow) => Boolean(g.table) && g.table !== "TBA" && names.has(g.table);

    const load = tableLoad(tables, guests.filter(isSeated));
    const waiting = guests.filter((g) => !isSeated(g));

    /* bucket by the group each guest belongs to */
    const buckets = new Map<string, GuestRow[]>();
    for (const g of waiting) {
      const k = groupOf(g);
      if (!buckets.has(k)) buckets.set(k, []);
      (buckets.get(k) as GuestRow[]).push(g);
    }

    type Move = { id: string; tableName: string; section: string };
    const moves: Move[] = [];

    const plan = Array.from(buckets.entries()).map(([group, list]) => {
      const waitingSeats = list.reduce((a, g) => a + g.partySize, 0);

      /* no group recorded - the system has no honest basis for a guess,
         so it says so instead of dropping them somewhere wrong */
      if (!group) {
        return {
          group: "",
          waiting: list.length,
          waitingSeats,
          placed: [] as { name: string; table: string }[],
          shortfall: list.length,
          tablesNeeded: 0,
          reason: "no group recorded",
          names: list.map((g) => g.name),
        };
      }

      const mine = tables.filter((t) => t.section === group);
      const placed: { name: string; table: string }[] = [];
      const left: GuestRow[] = [];

      /* biggest parties first so a family of four is not shut out by
         singles that already ate the gaps */
      const ordered = [...list].sort((a, b) => b.partySize - a.partySize || a.name.localeCompare(b.name));

      for (const g of ordered) {
        const target = mine.find((t) => load[t.id] + g.partySize <= t.capacity);
        if (!target) { left.push(g); continue; }
        load[target.id] += g.partySize;
        placed.push({ name: g.name, table: target.name });
        moves.push({ id: g.id, tableName: target.name, section: target.section });
      }

      const cap = mine.length ? mine[0].capacity : 10;
      const shortSeats = left.reduce((a, g) => a + g.partySize, 0);

      return {
        group,
        waiting: list.length,
        waitingSeats,
        placed,
        shortfall: left.length,
        tablesNeeded: shortSeats ? Math.ceil(shortSeats / cap) : 0,
        reason: !mine.length
          ? "no tables in this group yet"
          : left.length
          ? "this group's tables are full"
          : "",
        names: left.map((g) => g.name),
      };
    });

    /* groups with something to say first, then the clean ones */
    plan.sort((a, b) => b.shortfall - a.shortfall || b.placed.length - a.placed.length);

    if (apply) {
      for (const m of moves) {
        await prisma.guest.update({
          where: { id: m.id },
          data: { table: m.tableName, section: m.section },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      applied: apply,
      placed: moves.length,
      left: waiting.length - moves.length,
      plan,
    });
  }

  if (action === "autoSeat") {
    const [tables, guests] = await Promise.all([
      prisma.seatTable.findMany({
        where: { eventId: event.id },
        orderBy: [{ section: "asc" }, { position: "asc" }],
        select: { id: true, name: true, section: true, capacity: true },
      }),
      prisma.guest.findMany({
        where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY, status: "approved", rsvpAnswer: { not: "no" }, OR: [{ table: "TBA" }, { table: "" }] },
        orderBy: [{ tier: "asc" }, { name: "asc" }],
        select: { id: true, name: true, section: true, table: true, partySize: true },
      }),
    ]);

    if (tables.length === 0) return NextResponse.json({ error: "Create tables first." }, { status: 400 });

    const seatedAll = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY },
      select: { id: true, name: true, section: true, table: true, partySize: true },
    });
    const load = tableLoad(tables, seatedAll);

    let placed = 0;
    let grouped = 0;

    for (const g of guests) {
      /* A guest who belongs to a group goes into that group or nowhere.
         Dropping a bank colleague onto a family table to fill a gap is
         worse than leaving them for the host to place, because nobody
         would notice the mistake until the guest was standing at the
         wrong table. Guests with no group fall back to any free seat,
         which is how this has always behaved. */
      const group = groupOf(g);
      const pool = group ? tables.filter((t) => t.section === group) : tables;
      if (group && !pool.length) continue;

      const target = pool.find((t) => load[t.id] + g.partySize <= t.capacity);
      if (!target) continue;

      await prisma.guest.update({
        where: { id: g.id },
        data: { table: target.name, section: target.section },
      });
      load[target.id] += g.partySize;
      placed++;
      if (group) grouped++;
    }

    return NextResponse.json({ ok: true, placed, grouped, left: guests.length - placed });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
