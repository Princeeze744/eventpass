import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const { slug, phone } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const cleanPhone = normPhone(phone);
  if (!cleanPhone || cleanPhone.length < 7) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const guest = await prisma.guest.findFirst({
    where: { eventId: event.id, phone: cleanPhone },
  });
  if (!guest) {
    return NextResponse.json({ error: "No registration found for this number." }, { status: 404 });
  }

  return NextResponse.json({ passId: guest.passId });
}
