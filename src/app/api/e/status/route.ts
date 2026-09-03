import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendApprovalEmail, sendRegistrationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { slug, adminKey, id, status, tier, action, email } = await req.json();
  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({ where: { id: String(id), eventId: event.id } });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resend the pass email on demand, or set an email address
  if (action === "sendPass") {
    const target = String(email || guest.email || "").trim().toLowerCase();
    if (!target) return NextResponse.json({ error: "No email address for this guest." }, { status: 400 });
    if (target !== guest.email) {
      await prisma.guest.update({ where: { id: guest.id }, data: { email: target } });
    }
    if (guest.status === "approved") {
      await sendApprovalEmail({
        to: target, guestName: guest.name, eventTitle: event.title, tagline: event.tagline,
        slug: event.slug, passId: guest.passId, eventDate: event.eventDate,
        eventDateISO: event.eventDateISO, eventTime: event.eventTime,
        venue: event.venue, address: event.address, table: guest.table,
      });
    } else {
      await sendRegistrationEmail({
        to: target, guestName: guest.name, eventTitle: event.title, tagline: event.tagline,
        slug: event.slug, passId: guest.passId, eventDate: event.eventDate,
        eventTime: event.eventTime, venue: event.venue, autoApproved: false,
      });
    }
    await prisma.guest.update({ where: { id: guest.id }, data: { passSentAt: new Date() } }).catch(() => {});
    return NextResponse.json({ ok: true, sent: target });
  }

  const data: { status?: string; tier?: string } = {};
  if (status && ["pending", "approved", "declined"].includes(status)) data.status = status;
  if (tier && ["Guest", "Family", "VIP", "Vendor"].includes(tier)) data.tier = tier;

  await prisma.guest.update({ where: { id: guest.id }, data });

  if (data.status === "approved" && guest.status !== "approved" && guest.email) {
    await sendApprovalEmail({
      to: guest.email,
      guestName: guest.name,
      eventTitle: event.title,
      tagline: event.tagline,
      slug: event.slug,
      passId: guest.passId,
      eventDate: event.eventDate,
      eventDateISO: event.eventDateISO,
      eventTime: event.eventTime,
      venue: event.venue,
      address: event.address,
      table: guest.table,
    });
    await prisma.guest.update({ where: { id: guest.id }, data: { passSentAt: new Date() } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
