import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

const FIELDS = [
  "story","dressCode","colours","hotels","restaurants","funSpots",
  "ceremonyName","ceremonyMap","receptionMap","livestream",
  "programNote","menuNote","giftNote","bankDetails","coverImage","gallery","hashtag",
] as const;

export async function POST(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  const body = await req.json();
  const { slug } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const authorized = userId === event.ownerId || body.adminKey === event.adminKey;
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: Record<string, string | null> = {};
  for (const f of FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f].trim() || null;
  }

  await prisma.event.update({ where: { id: event.id }, data });
  return NextResponse.json({ ok: true });
}
