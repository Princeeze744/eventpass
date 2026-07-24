import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

const EDITABLE = ["title","hostName","tagline","eventDate","eventTime","venue","address","approvalMode"] as const;

export async function POST(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const { slug, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "trash") {
    await prisma.event.update({ where: { id: event.id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    await prisma.event.update({ where: { id: event.id }, data: { deletedAt: null } });
    return NextResponse.json({ ok: true });
  }

  if (action === "destroy") {
    if (body.confirmTitle !== event.title) {
      return NextResponse.json({ error: "Type the event title exactly to confirm." }, { status: 400 });
    }
    await prisma.event.delete({ where: { id: event.id } });
    return NextResponse.json({ ok: true, destroyed: true });
  }

  if (action === "update") {
    const data: Record<string, string | number | null> = {};
    for (const f of EDITABLE) {
      if (typeof body[f] === "string" && body[f].trim()) data[f] = body[f].trim();
    }
    if (typeof body.dateISO === "string" && body.dateISO) {
      data.eventDateISO = body.dateISO;
    }
    if (body.capacity !== undefined) {
      data.capacity = body.capacity ? Number(body.capacity) : null;
    }
    await prisma.event.update({ where: { id: event.id }, data });
    return NextResponse.json({ ok: true });
  }

  if (action === "rotateKeys") {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const gen = (p: string) => `${p}-${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
    await prisma.event.update({
      where: { id: event.id },
      data: { adminKey: gen("ADM"), usherKey: gen("GATE") },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
