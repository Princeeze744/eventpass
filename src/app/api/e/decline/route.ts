import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const { slug, passId, phone, answer } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

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
