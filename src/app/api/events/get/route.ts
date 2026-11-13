import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await rateLimit(`events-get:${callerIp(req)}`, LIMITS.read.limit, LIMITS.read.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug") || "";
  /* already scoped to the owner, which is why this one needed no
     repair - the event and the person are matched in the same query */
  const event = await prisma.event.findFirst({
    where: { slug, ownerId: userId, deletedAt: null },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  /* The settings page reads d.days to populate its day editor, and
     saving days deletes and recreates every row from what that editor
     holds. Without this query the editor loaded empty, so saving days
     on a live multi-day event replaced the real days with whatever was
     on screen. */
  const days = await prisma.eventDay.findMany({
    where: { eventId: event.id },
    orderBy: { position: "asc" },
    select: {
      label: true,
      dateISO: true,
      dateText: true,
      time: true,
      venue: true,
      address: true,
      capacity: true,
    },
  });

  return NextResponse.json({
    event: {
      title: event.title,
      eventType: event.eventType,
      hostName: event.hostName,
      hostEmail: event.hostEmail,
      tagline: event.tagline,
      eventDate: event.eventDate,
      eventDateISO: event.eventDateISO,
      eventTime: event.eventTime,
      venue: event.venue,
      state: event.state,
      address: event.address,
      capacity: event.capacity,
      approvalMode: event.approvalMode,
      accentColor: event.accentColor,
    },
    days,
  });
}
