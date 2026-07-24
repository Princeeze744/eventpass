import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { slug, adminKey, id, status, tier } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({ where: { id: String(id), eventId: event.id } });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { status?: string; tier?: string } = {};
  if (status && ["pending", "approved", "declined"].includes(status)) data.status = status;
  if (tier && ["Guest", "Family", "VIP", "Vendor"].includes(tier)) data.tier = tier;

  await prisma.guest.update({ where: { id: guest.id }, data });
  return NextResponse.json({ ok: true });
}
