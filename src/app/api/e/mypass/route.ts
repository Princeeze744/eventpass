import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone } from "@/lib/ids";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   "Find my pass" - a guest types the number they registered with and
   gets their pass back.

   The convenience and the danger are the same thing: a phone number
   goes in and a working pass comes out. Nigerian mobile numbers are
   a small, well-known space, so without a limit this endpoint will
   happily walk somebody through it and hand over every guest's pass
   at an event, one request at a time.

   A real guest tries once, maybe three times if they typed it wrong.
   Ten attempts in five minutes is generous for a person and useless
   to a script, which is exactly the shape a limit should have.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { slug, phone } = await req.json().catch(() => ({ slug: "", phone: "" }));

  const ip = callerIp(req);
  const gate = await rateLimit(`mypass:${ip}`, LIMITS.mypass.limit, LIMITS.mypass.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const cleanPhone = normPhone(phone);
  if (!cleanPhone || cleanPhone.length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  /* A second budget against the number itself, so a thousand machines
     cannot share the work of hammering one guest's phone number. */
  const perNumber = await rateLimit(
    `mypass-num:${event.id}:${cleanPhone}`,
    LIMITS.mypass.limit,
    LIMITS.mypass.window
  );
  if (!perNumber.ok) return tooMany(perNumber.retryAfter);

  const guest = await prisma.guest.findFirst({
    where: { deletedAt: null, eventId: event.id, phone: cleanPhone },
  });
  if (!guest) {
    return NextResponse.json({ error: "No registration found for this number." }, { status: 404 });
  }

  return NextResponse.json({ passId: guest.passId });
}
