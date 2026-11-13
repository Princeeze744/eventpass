import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* Public by design - this is what an invitation page reads, and it
   returns only what the event's own public page already shows. No
   guests, no counts, no keys. It needs a budget rather than a lock. */
export async function GET(req: NextRequest) {
  const gate = await rateLimit(`invite:${callerIp(req)}`, LIMITS.read.limit, LIMITS.read.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const slug = req.nextUrl.searchParams.get("slug") || "";
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || event.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    event: {
      title: event.title,
      tagline: event.tagline,
      hostName: event.hostName,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      venue: event.venue,
      address: event.address,
      dressCode: event.dressCode,
      coverImage: event.coverImage,
      logoUrl: event.logoUrl,
      accentColor: event.accentColor,
    },
  });
}
