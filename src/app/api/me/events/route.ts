import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { normPhone } from "@/lib/ids";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = normPhone(user.phone);
  if (!phone) return NextResponse.json({ user: { name: user.name, role: user.role, phone: user.phone }, records: [] });

  const records = await prisma.guest.findMany({
    where: { phone, deletedAt: null },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    user: { name: user.name, role: user.role, phone: user.phone },
    records: records
      .filter((g) => !g.event.deletedAt)
      .map((g) => ({
        passId: g.passId,
        status: g.status,
        rsvpAnswer: g.rsvpAnswer,
        checkedIn: g.checkedIn,
        checkedInOnline: g.checkedInOnline,
        tier: g.tier,
        company: g.company,
        vendorRole: g.vendorRole,
        callTime: g.callTime,
        vendorNote: g.vendorNote,
        table: g.table,
        partySize: g.partySize,
        event: {
          slug: g.event.slug,
          title: g.event.title,
          tagline: g.event.tagline,
          eventDate: g.event.eventDate,
          eventTime: g.event.eventTime,
          venue: g.event.venue,
          address: g.event.address,
          ceremonyMap: g.event.ceremonyMap,
          receptionMap: g.event.receptionMap,
          livestream: g.event.livestream,
          programNote: g.event.programNote,
          vendorBrief: g.event.vendorBrief,
          loadInTime: g.event.loadInTime,
          dressCode: g.event.dressCode,
        },
      })),
  });
}
