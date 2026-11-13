import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   Express check-in: a guest marks themselves as on the way, from
   their own pass page.

   It has no key, and it should not have one - the pass ID IS the
   credential, and the guest holding it is the only person who can
   produce it. That is fine as far as it goes.

   What is not fine is that it answers truthfully and instantly about
   whether a pass ID exists: 200 for a real one, 404 for an invented
   one. That makes it the perfect instrument for finding valid passes
   by trying them, which is a far more attractive endpoint for that
   than any of the ones we had already protected.

   Longer pass IDs made each guess worthless. A limit makes the
   guessing itself worthless, which is the half that actually ends it.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { slug, passId } = await req.json().catch(() => ({ slug: "", passId: "" }));

  const ip = callerIp(req);
  const gate = await rateLimit(`checkin:${ip}`, LIMITS.verify.limit, LIMITS.verify.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const guest = await prisma.guest.findFirst({
    where: { deletedAt: null, eventId: event.id, passId: String(passId || "").trim() },
  });

  if (!guest) {
    /* a miss costs far more of the budget than a hit, because only
       somebody guessing produces a stream of misses */
    const miss = await rateLimit(`checkin-miss:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!miss.ok) return tooMany(miss.retryAfter);
    return NextResponse.json({ error: "Pass not found." }, { status: 404 });
  }

  if (guest.status !== "approved") {
    return NextResponse.json({ error: "Pass is not approved yet." }, { status: 403 });
  }

  await prisma.guest.update({ where: { id: guest.id }, data: { checkedInOnline: true } });
  return NextResponse.json({ ok: true });
}
