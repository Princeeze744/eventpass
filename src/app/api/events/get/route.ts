import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug") || "";
  const event = await prisma.event.findFirst({
    where: { slug, ownerId: userId, deletedAt: null },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    event: {
      title: event.title,
      eventType: event.eventType,
      hostName: event.hostName,
      tagline: event.tagline,
      eventDate: event.eventDate,
      eventDateISO: event.eventDateISO,
      eventTime: event.eventTime,
      venue: event.venue,
      address: event.address,
      capacity: event.capacity,
      approvalMode: event.approvalMode,
    },
  });
}