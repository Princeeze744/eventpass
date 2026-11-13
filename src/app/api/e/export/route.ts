import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   The export.

   Of everything on this platform, this is the single request worth
   stealing: one call, one file, every guest's name, phone number and
   email address. If anything here ever becomes a data-protection
   incident, it is almost certainly this.

   It was already key-protected. What it had no answer to was someone
   trying keys all night, so the key is now budgeted tightly, and a
   wrong one costs far more than a right one.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const ip = callerIp(req);

  /* a host exports a handful of times a day, never a hundred */
  const gate = await rateLimit(`export:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const { slug, adminKey } = await req.json().catch(() => ({}));
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  if (!(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`export-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* Two things were missing here and both put rows in the host's export
     that should never have been there: vendors are crew rather than
     guests, and a trashed guest is one the host deliberately removed.
     Vendors have their own page; this file is the guest list. */
  const guests = await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null, isVendor: false },
    orderBy: { name: "asc" },
  });

  /* A cell beginning = + - or @ is read as a formula by Excel and
     Sheets, so a guest who registers as "=HYPERLINK(...)" becomes
     live code the moment the host opens their own export. Quoting
     does not stop it; a leading apostrophe does. */
  const esc = (v: string) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const header = ["Name", "Phone", "Email", "Category", "Party Size", "Pass ID", "Status", "RSVP", "Section", "Table", "Seat", "Checked In", "Arrival Time"];
  const rows = guests.map((g) => [
    esc(g.name),
    esc(g.phone || ""),
    esc(g.email || ""),
    esc(g.tier),
    g.partySize,
    esc(g.passId),
    esc(g.status),
    esc(g.rsvpAnswer === "no" ? "Not attending" : "Attending"),
    esc(g.section || ""),
    esc(g.table),
    esc(g.seat || ""),
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
