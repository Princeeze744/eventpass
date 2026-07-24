import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, passId } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const guest = await prisma.guest.findFirst({
    where: { deletedAt: null, eventId: event.id, passId: String(passId || "").trim() },
  });
  if (!guest) return NextResponse.json({ error: "Pass not found." }, { status: 404 });
  if (guest.status !== "approved") {
    return NextResponse.json({ error: "Pass is not approved yet." }, { status: 403 });
  }

  await prisma.guest.update({ where: { id: guest.id }, data: { checkedInOnline: true } });
  return NextResponse.json({ ok: true });
}
