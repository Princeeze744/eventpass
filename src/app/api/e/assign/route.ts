import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, passId, table, usherKey } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || usherKey !== event.usherKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({
    where: { eventId: event.id, passId: String(passId || "").trim() },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.guest.update({
    where: { id: guest.id },
    data: { table: String(table || "").trim() || "TBA" },
  });
  return NextResponse.json({ ok: true });
}
