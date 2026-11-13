import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { sendApprovalEmail, sendReminderEmail } from "@/lib/mailer";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`manage:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const body = await req.json().catch(() => ({}));
  const { slug, adminKey, action, ids } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`manage-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idList: string[] = Array.isArray(ids) ? ids.map(String) : [];

  if (action === "trash" && idList.length) {
    await prisma.guest.updateMany({
      where: { eventId: event.id, id: { in: idList } },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true, count: idList.length });
  }

  if (action === "restore" && idList.length) {
    await prisma.guest.updateMany({
      where: { eventId: event.id, id: { in: idList } },
      data: { deletedAt: null },
    });
    return NextResponse.json({ ok: true, count: idList.length });
  }

  if (action === "destroy" && idList.length) {
    await prisma.guest.deleteMany({ where: { eventId: event.id, id: { in: idList } } });
    return NextResponse.json({ ok: true, count: idList.length });
  }

  if (action === "bulkStatus" && idList.length) {
    const status = String(body.status);
    if (!["pending", "approved", "declined"].includes(status)) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    await prisma.guest.updateMany({
      where: { eventId: event.id, id: { in: idList } },
      data: { status },
    });
    if (status === "approved") {
      /* a vendor's approval is handled on the vendors page and carries a
         call time, not a guest pass - never send them the guest email */
      const approved = await prisma.guest.findMany({
        where: { eventId: event.id, id: { in: idList }, isVendor: false, email: { not: null }, passSentAt: null },
      });
      for (const g of approved) {
        await sendApprovalEmail({
          to: g.email as string,
          guestName: g.name,
          eventTitle: event.title,
          tagline: event.tagline,
          slug: event.slug,
          passId: g.passId,
          eventDate: event.eventDate,
          eventDateISO: event.eventDateISO,
          eventTime: event.eventTime,
          venue: event.venue,
          address: event.address,
          table: g.table,
        });
        await prisma.guest.update({ where: { id: g.id }, data: { passSentAt: new Date() } }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, count: idList.length });
  }

  if (action === "remindAll") {
    /* "Send reminder" is a guest-facing message about attending. Crew
       get their brief and call time from the vendors page instead. */
    const list = await prisma.guest.findMany({
      where: { eventId: event.id, deletedAt: null, isVendor: false, status: "approved", rsvpAnswer: { not: "no" }, email: { not: null } },
    });
    let sent = 0;
    for (const g of list) {
      await sendReminderEmail({
        to: g.email as string, guestName: g.name, eventTitle: event.title, tagline: event.tagline,
        slug: event.slug, passId: g.passId, eventDate: event.eventDate, eventDateISO: event.eventDateISO,
        eventTime: event.eventTime, venue: event.venue, address: event.address, table: g.table,
        note: typeof body.note === "string" ? body.note.trim() : "",
      });
      sent++;
    }
    return NextResponse.json({ ok: true, sent });
  }

  if (action === "edit") {
    const data: Record<string, string | number | null> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.phone === "string") data.phone = body.phone.replace(/\D/g, "").slice(-10);
    if (typeof body.tier === "string" && ["Guest","Family","VIP","Vendor"].includes(body.tier)) data.tier = body.tier;
    if (typeof body.table === "string") data.table = body.table.trim() || "TBA";
    if (body.partySize) data.partySize = Math.max(1, Math.min(10, Number(body.partySize)));
    if (typeof body.email === "string") data.email = body.email.trim().toLowerCase() || null;

    /* Scoped to this event. It was updating by guest id alone, which
       meant one valid admin key let the holder rename, re-phone or
       re-email a guest at ANY event on the platform - they only had
       to know that guest's id. updateMany takes a where clause the
       way update cannot, so the event is part of the match rather
       than something we check and then forget. */
    const r = await prisma.guest.updateMany({
      where: { id: String(body.id), eventId: event.id },
      data,
    });
    if (!r.count) return NextResponse.json({ error: "Guest not found on this event." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "resetCheckin") {
    await prisma.guest.updateMany({
      where: { eventId: event.id, id: { in: idList } },
      data: { checkedIn: false, checkedInAt: null, checkedInOnline: false },
    });
    return NextResponse.json({ ok: true, count: idList.length });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
