import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function makeKey(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

export async function POST(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const { title, hostName, tagline, eventDate, eventTime, venue, address, approvalMode, capacity } = body;

  if (!title || !eventDate || !venue) {
    return NextResponse.json({ error: "Title, date and venue are required." }, { status: 400 });
  }

  let slug = slugify(String(title));
  if (!slug) slug = "event";
  let candidate = slug;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${++n}`;
  }

  const event = await prisma.event.create({
    data: {
      slug: candidate,
      ownerId: userId,
      title: String(title).trim(),
      eventType: body.eventType ? String(body.eventType).trim() : "Wedding",
      hostName: hostName ? String(hostName).trim() : "",
      tagline: tagline ? String(tagline).trim() : "A Celebration",
      eventDate: String(eventDate).trim(),
      eventDateISO: body.dateISO ? String(body.dateISO).trim() : "",
      eventTime: eventTime ? String(eventTime).trim() : "12:00 PM",
      venue: String(venue).trim(),
      address: address ? String(address).trim() : "",
      approvalMode: approvalMode === "auto" ? "auto" : "manual",
      capacity: capacity ? Number(capacity) : null,
      adminKey: makeKey("ADM"),
      usherKey: makeKey("GATE"),
    },
  });

  return NextResponse.json({ ok: true, slug: event.slug });
}
