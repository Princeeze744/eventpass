import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/ids";
import { canManageEvent } from "@/lib/eventAccess";

const TIERS = ["Guest", "Family", "VIP", "Vendor"];

/* ------------------------------------------------------------------
   Split one CSV line, respecting quotes so that a name like
   "Okafor, Jr." survives instead of becoming two columns.
------------------------------------------------------------------ */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === "," || c === "\t" || c === ";") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/* Which column is which, worked out from the header row. */
type ColMap = {
  name?: number;
  phone?: number;
  email?: number;
  tier?: number;
  party?: number;
  table?: number;
  group?: number;
};

function readHeader(cells: string[]): ColMap | null {
  const map: ColMap = {};
  let hits = 0;

  cells.forEach((raw, i) => {
    const h = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!h) return;

    if (map.name === undefined && (h === "name" || h === "guest" || h === "guestname" || h === "fullname")) {
      map.name = i; hits++;
    } else if (map.phone === undefined && (h.includes("phone") || h.includes("mobile") || h.includes("whatsapp") || h === "number" || h === "tel")) {
      map.phone = i; hits++;
    } else if (map.email === undefined && (h.includes("email") || h.includes("mail"))) {
      map.email = i; hits++;
    } else if (map.tier === undefined && (h.includes("category") || h.includes("tier") || h.includes("type"))) {
      map.tier = i; hits++;
    } else if (map.party === undefined && (h.includes("party") || h.includes("seats") || h.includes("guests") || h === "size")) {
      map.party = i; hits++;
    /* GROUP is tested before TABLE on purpose: "Table Group" contains
       both words, and the group is the one the host means. */
    } else if (map.group === undefined && (h.includes("group") || h.includes("section") || h.includes("affiliation"))) {
      map.group = i; hits++;
    } else if (map.table === undefined && h.includes("table")) {
      map.table = i; hits++;
    }
  });

  /* needs a name column plus at least one other recognised one,
     otherwise this is a data row and not a header */
  if (map.name === undefined || hits < 2) return null;
  return map;
}

const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: NextRequest) {
  const { slug, adminKey, list, autoApprove } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!(await canManageEvent(event, String(adminKey || "")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!list || typeof list !== "string") {
    return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
  }

  const lines = String(list).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  /* if the first line is a header, use it and skip that row */
  let map: ColMap | null = null;
  let start = 0;
  if (lines.length) {
    const maybe = readHeader(splitLine(lines[0]));
    if (maybe) {
      map = maybe;
      start = 1;
    }
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let withEmail = 0;
  let withGroup = 0;
  const groups = new Set<string>();
  const errors: string[] = [];

  for (let li = start; li < lines.length; li++) {
    const parts = splitLine(lines[li]);

    const at = (i?: number) => (i === undefined ? "" : (parts[i] || "").trim());

    const name = map ? at(map.name) : (parts[0] || "").trim();

    /* email: the mapped column first, then anywhere in the row.
       This rescues lists where the column sits somewhere unexpected. */
    let email = (map ? at(map.email) : (parts[4] || "")).trim().toLowerCase();
    if (!looksLikeEmail(email)) {
      const found = parts.find((p) => looksLikeEmail(p.trim()));
      email = found ? found.trim().toLowerCase() : "";
    }

    /* phone: mapped column, else the first cell that reads as one */
    let phone = normPhone(map ? at(map.phone) : (parts[1] || ""));
    if (!phone) {
      for (let i = 0; i < parts.length; i++) {
        if (i === map?.name) continue;
        const cell = parts[i].trim();
        if (looksLikeEmail(cell)) continue;
        if (!/\d/.test(cell)) continue;
        if (cell.replace(/\D/g, "").length < 10) continue;
        const p = normPhone(cell);
        if (p) { phone = p; break; }
      }
    }

    const rawTier = (map ? at(map.tier) : (parts[2] || "")).toLowerCase();
    const tier =
      rawTier.startsWith("vip") ? "VIP"
      : rawTier.startsWith("fam") ? "Family"
      : rawTier.startsWith("ven") ? "Vendor"
      : "Guest";

    const rawParty = map ? at(map.party) : (parts[3] || "");
    const partySize = Math.max(1, Math.min(10, Number(rawParty) || 1));

    const table = (map ? at(map.table) : "").trim();

    /* ------------------------------------------------------------
       The GROUP a guest belongs to - "Standard Chartered Bank",
       "Arowojobe Family", "Uyi's Friends".

       Real events are seated by affiliation, not one guest at a time,
       and the group is knowledge only the host has. Carried in on the
       list, it lets a guest be seated the moment they say yes instead
       of waiting for someone to remember who they are.

       It is stored in `section`, the same field seating has always
       stamped from the table, so a group named here and a table
       section named the same thing are the same group.
    ------------------------------------------------------------ */
    const group = (map ? at(map.group) : "").trim().slice(0, 60);

    if (!name || name.length < 2) { skipped++; continue; }
    if (/^(name|guest|guest name|full name)$/i.test(name)) { skipped++; continue; }

    const exists = await prisma.guest.findFirst({
      where: {
        eventId: event.id,
        OR: phone
          ? [{ phone }, { name: { equals: name, mode: "insensitive" } }]
          : [{ name: { equals: name, mode: "insensitive" } }],
      },
    });

    if (exists) {
      const patch: { deletedAt?: null; email?: string; phone?: string; section?: string } = {};
      if (exists.deletedAt) patch.deletedAt = null;
      if (email && !exists.email) patch.email = email;
      if (phone && !exists.phone) patch.phone = phone;
      /* fill a missing group, never overwrite one - an existing value
         may be the section of the table they are already sitting at,
         and a re-import must not move anybody */
      if (group && !String(exists.section || "").trim()) patch.section = group;
      if (Object.keys(patch).length) {
        await prisma.guest.update({ where: { id: exists.id }, data: patch });
        if (patch.email) { updated++; withEmail++; }
        else if (patch.phone) updated++;
        else if (patch.section) updated++;
        if (patch.section) { withGroup++; groups.add(group); }
        if (patch.deletedAt === null) added++;
      } else {
        skipped++;
      }
      continue;
    }

    let passId = generatePassId();
    while (await prisma.guest.findUnique({ where: { passId } })) passId = generatePassId();

    try {
      await prisma.guest.create({
        data: {
          eventId: event.id,
          passId,
          name,
          phone: phone || null,
          email: email || null,
          tier: TIERS.includes(tier) ? tier : "Guest",
          partySize,
          ...(table ? { table } : {}),
          ...(group ? { section: group } : {}),
          status: autoApprove ? "approved" : "pending",
        },
      });
      added++;
      if (email) withEmail++;
      if (group) { withGroup++; groups.add(group); }
    } catch {
      errors.push(name);
      skipped++;
    }
  }

  return NextResponse.json({
    added,
    updated,
    skipped,
    withEmail,
    withGroup,
    groups: Array.from(groups).slice(0, 20),
    headerDetected: Boolean(map),
    groupDetected: Boolean(map && map.group !== undefined),
    total: lines.length - start,
    errors: errors.slice(0, 5),
  });
}
