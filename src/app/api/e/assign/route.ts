import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

/* ------------------------------------------------------------------
   An usher seats a guest from the gate screen.

   The lookup here was already scoped to the event, which is why this
   one needed no repair - only a budget. A wrong gate key costs the
   tight one, so this cannot be used to work out a key either.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`assign:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const { slug, passId, table, usherKey } = await req.json().catch(() => ({}));

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || usherKey !== event.usherKey) {
    const guess = await rateLimit(`assign-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({
    where: { eventId: event.id, passId: String(passId || "").trim() },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.guest.update({
    where: { id: guest.id },
    data: { table: String(table || "").trim().slice(0, 60) || "TBA" },
  });
  return NextResponse.json({ ok: true });
}
