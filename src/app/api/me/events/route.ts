import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { normPhone } from "@/lib/ids";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   Everything the signed-in person is registered to, matched on the
   phone number they linked.

   This returns PASS IDS, and a pass ID opens a pass. It is therefore
   only ever as trustworthy as the link between an account and a phone
   number - and that link is currently unverified. See the note in
   api/me/link: until a one-time code proves the number, anybody can
   claim somebody else's and read this.

   Budgeted per account rather than per address, because the person is
   signed in and the account is the thing worth limiting.
------------------------------------------------------------------ */
export async function GET() {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const gate = await rateLimit(`meevents:${userId}`, 60, 60);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = normPhone(user.phone);
  if (!phone) return NextResponse.json({ user: { name: user.name, role: user.role, phone: user.phone }, records: [] });

  const hosting = user.email
    ? await prisma.event.findMany({
        where: { hostEmail: user.email.toLowerCase(), deletedAt: null, ownerId: { not: userId } },
        orderBy: { createdAt: "desc" },
        select: { slug: true, title: true, tagline: true, eventDate: true, venue: true, accentColor: true },
      })
    : [];

  const records = await prisma.guest.findMany({
    where: { phone, deletedAt: null },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    user: { name: user.name, role: user.role, phone: user.phone },
    hosting,
    records: records
      .filter((g) => !g.event.deletedAt && g.event.ownerId !== userId)
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
          logoUrl: g.event.logoUrl,
          coverImage: g.event.coverImage,
          gallery: g.event.gallery,
          loadInTime: g.event.loadInTime,
          dressCode: g.event.dressCode,
        },
      })),
  });
}
