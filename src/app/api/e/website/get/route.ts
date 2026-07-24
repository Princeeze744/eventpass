import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const userId = await getSessionOrganizerId();
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { story, dressCode, colours, hotels, restaurants, funSpots, ceremonyName, ceremonyMap, receptionMap, livestream, programNote, menuNote, giftNote, bankDetails, coverImage, gallery, hashtag, logoUrl } = event;
  return NextResponse.json({
    event: { story, dressCode, colours, hotels, restaurants, funSpots, ceremonyName, ceremonyMap, receptionMap, livestream, programNote, menuNote, giftNote, bankDetails, coverImage, gallery, hashtag, logoUrl },
  });
}
