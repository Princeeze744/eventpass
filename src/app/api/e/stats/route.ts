import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   The live arrivals board.

   This endpoint used to take a slug and nothing else. No key, no
   session, no limit - and it returns guest NAMES, tiers and table
   numbers in `recent`. Slugs are short and guessable (ama60, uyi-50),
   so anyone who tried a few words could read a client's arrivals in
   real time, from anywhere, for as long as they liked.

   It now needs the admin key, the gate key, or a signed-in owner.
   The live wall carries one: see the unlock screen on that page.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  const adminKey = String(body.adminKey || "").trim();
  const usherKey = String(body.usherKey || "").trim();

  /* The board polls every four seconds, so this has to sit well above
     normal use and well below what a script needs to be useful. */
  const gate = await rateLimit(
    `stats:${callerIp(req)}`,
    LIMITS.read.limit,
    LIMITS.read.window
  );
  if (!gate.ok) return tooMany(gate.retryAfter);

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  /* Boolean() first: two empty strings are equal, and without it an
     empty key would match an empty field and let everyone through. */
  const isUsher = Boolean(usherKey) && usherKey === event.usherKey;
  const allowed = isUsher || (await canManageEvent(event, adminKey));

  if (!allowed) {
    /* a wrong key is charged to a much tighter budget than a right
       one, so guessing stops being worth anybody's time */
    const guess = await rateLimit(
      `stats-auth:${callerIp(req)}`,
      LIMITS.auth.limit,
      LIMITS.auth.window
    );
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const everyone = await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null },
    orderBy: { checkedInAt: "desc" },
  });

  /* Vendors are crew, not guests - see the note in the host route.
     Split out so the live wall never shows catering staff as guests. */
  const guests = everyone.filter((g) => !g.isVendor);
  const vendorRows = everyone.filter((g) => g.isVendor);

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
    vendors: vendorRows.length,
    vendorsArrived: vendorRows.filter((g) => g.checkedIn).length,
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
