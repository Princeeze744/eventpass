import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone } from "@/lib/ids";
import { rateLimit, callerIp, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   "I can't make it" - a guest answers from the link in their email.

   This has no key and cannot have one: the whole point is a guest
   tapping a link without logging into anything. The pass ID in that
   link IS the credential, and it is a reasonable one.

   The phone number is not. A phone number is not a secret, and this
   endpoint accepts one in place of a pass - so anybody could walk a
   range of Nigerian numbers against an event slug and mark a whole
   wedding as not attending. The host would find out when the caterer
   asked why the numbers had collapsed.

   Removing the phone route outright risks breaking a page that still
   uses it, so instead it is budgeted to the point of uselessness:
   five attempts per address per ten minutes, and an event-wide cap
   that no genuine evening of guests replying comes near but a script
   exhausts in seconds. A pass ID, being a real credential, is given
   the ordinary allowance.

   TODO once it is confirmed nothing calls this with a phone: drop
   the phone branch and require the pass.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { slug, passId, phone, answer } = await req.json().catch(() => ({}));

  const ip = callerIp(req);
  const byPhone = !passId;

  const gate = await rateLimit(
    `decline:${ip}`,
    byPhone ? 5 : 20,
    600
  );
  if (!gate.ok) return tooMany(gate.retryAfter);

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  if (byPhone) {
    /* a second ceiling on the event itself, so a hundred addresses
       cannot together do what one address cannot */
    const perEvent = await rateLimit(`decline-ev:${event.id}`, 40, 3600);
    if (!perEvent.ok) return tooMany(perEvent.retryAfter);
  }

  const where = passId
    ? { eventId: event.id, passId: String(passId).trim(), deletedAt: null }
    : { eventId: event.id, phone: normPhone(phone), deletedAt: null };

  const guest = await prisma.guest.findFirst({ where });
  if (!guest) return NextResponse.json({ error: "Registration not found." }, { status: 404 });

  const saying = answer === "yes" ? "yes" : "no";

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      rsvpAnswer: saying,
      declinedAt: saying === "no" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, answer: saying });
}
