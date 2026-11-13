import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { sendApprovalEmail, sendRegistrationEmail } from "@/lib/mailer";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

/* This route was already written correctly: the guest is fetched by
   id AND event before anything touches it, so a key for one event
   cannot reach a row on another. It needed only a budget - and it is
   worth saying that out loud, because it is the pattern the other
   routes should have followed. */
export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`status:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const { slug, adminKey, id, status, tier, action, email } = await req.json().catch(() => ({}));

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`status-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guest = await prisma.guest.findFirst({ where: { id: String(id), eventId: event.id } });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "checkIn") {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "undoCheckIn") {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { checkedIn: false, checkedInAt: null, checkedInOnline: false },
    });
    return NextResponse.json({ ok: true });
  }

  // Resend the pass email on demand, or set an email address
  if (action === "sendPass") {
    const target = String(email || guest.email || "").trim().toLowerCase();
    if (!target) return NextResponse.json({ error: "No email address for this guest." }, { status: 400 });
    /* the address is about to be sent a guest's pass, so it has to
       look like an address rather than whatever was typed */
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      return NextResponse.json({ error: "That is not a valid email address." }, { status: 400 });
    }
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
