import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    },
  });
}
