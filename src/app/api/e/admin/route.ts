import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   The host's guest list: every name and phone number on the event,
   and the power to approve or decline anyone.

   Two changes here.

   The key is now checked through canManageEvent, the way every other
   managing route already does it. It was imported in this file and
   never called, so a signed-in owner was still made to type their
   key while the rest of the app let them straight in. That was an
   inconsistency rather than a hole, but inconsistent auth is how
   holes are born.

   And a wrong key now costs twenty attempts per five minutes. This
   endpoint hands over the whole list, so it is exactly the one worth
   guessing at, and it was the one with nothing stopping you.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`admin:${ip}`, LIMITS.read.limit, LIMITS.read.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const { slug, adminKey, action, guestId, status } = await req.json().catch(() => ({}));

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || !(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`admin-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "status" && guestId) {
    if (!["pending", "approved", "declined"].includes(String(status))) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    /* scoped to this event: without it, a host with one valid key
       could change the status of a guest at somebody else's event
       simply by sending that guest's id */
    await prisma.guest.updateMany({
      where: { id: String(guestId), eventId: event.id },
      data: { status: String(status) },
    });
  }

  /* Two filters were missing and both put rows in front of the host that
     do not belong in a guest list: vendors are crew and have their own
     page, and a trashed guest is one the host deliberately removed. */
  const guests = await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null, isVendor: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    event: { title: event.title, tagline: event.tagline },
    guests: guests.map((g) => ({
      id: g.id,
      passId: g.passId,
      name: g.name,
      phone: g.phone,
      partySize: g.partySize,
      table: g.table,
      status: g.status,
      checkedIn: g.checkedIn,
      checkedInOnline: g.checkedInOnline,
    })),
  });
}
