import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { slug, adminKey, includeTrash } = body as {
    slug?: string; adminKey?: string; includeTrash?: boolean;
  };

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!(await canManageEvent(event, String(adminKey || "")))) {
    return NextResponse.json({ error: "Wrong admin key." }, { status: 401 });
  }

  /* Vendors are managed on the vendors page, where they have a call
     time and a role. Mixed into this list they are indistinguishable
     from guests, so they are excluded here and counted instead - that
     way the list is honest and nothing looks like it went missing. */
  const guests = await prisma.guest.findMany({
    where: {
      eventId: event.id,
      isVendor: false,
      ...(includeTrash ? {} : { deletedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });

  const vendorCount = await prisma.guest.count({
    where: {
      eventId: event.id,
      isVendor: true,
      ...(includeTrash ? {} : { deletedAt: null }),
    },
  });

  return NextResponse.json({
    event: { title: event.title, approvalMode: event.approvalMode },
    vendorCount,
    guests: guests.map((g) => ({
      id: g.id,
      passId: g.passId,
      name: g.name,
      phone: g.phone,
      email: g.email,
      passSentAt: g.passSentAt,
      partySize: g.partySize,
      tier: g.tier,
      table: g.table,
      status: g.status,
      rsvpAnswer: g.rsvpAnswer,
      checkedInOnline: g.checkedInOnline,
      checkedIn: g.checkedIn,
      deletedAt: g.deletedAt,
    })),
  });
}
