import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { normPhone, generatePassId } from "@/lib/ids";
import { sendVendorBadgeEmail } from "@/lib/mailer";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`vendors:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const body = await req.json().catch(() => ({}));
  const { slug, adminKey, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  /* canManageEvent was imported here and never called, so a signed-in
     owner was made to type a key the rest of the app let them past
     without. Inconsistent auth is how holes are born. */
  if (!(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`vendors-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "list") {
    const vendors = await prisma.guest.findMany({
      where: { eventId: event.id, isVendor: true, deletedAt: null },
      orderBy: { callTime: "asc" },
      include: { days: { include: { day: true } } },
    });
    const evDays = await prisma.eventDay.findMany({ where: { eventId: event.id }, orderBy: { position: "asc" } });
    return NextResponse.json({
      event: { title: event.title, vendorBrief: event.vendorBrief, loadInTime: event.loadInTime },
      eventDays: evDays.map((d) => ({ id: d.id, label: d.label, dateText: d.dateText, time: d.time })),
      vendors: vendors.map((v) => ({
        id: v.id, passId: v.passId, name: v.name, phone: v.phone, email: v.email,
        company: v.company, vendorRole: v.vendorRole, callTime: v.callTime,
        vendorNote: v.vendorNote, status: v.status, checkedIn: v.checkedIn,
        days: v.days.sort((a, b) => a.day.position - b.day.position).map((gd) => ({ dayId: gd.dayId, label: gd.day.label, callTime: gd.callTime })),
        checkedInAt: v.checkedInAt ? new Date(v.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      })),
    });
  }

  if (action === "add") {
    const phone = normPhone(body.phone);
    if (!body.name || String(body.name).trim().length < 2) {
      return NextResponse.json({ error: "Enter the vendor name." }, { status: 400 });
    }
    const vEmail = String(body.email || "").trim().toLowerCase();
    if (!vEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vEmail)) {
      return NextResponse.json({ error: "Enter a valid email address for the vendor." }, { status: 400 });
    }

    const existing = phone ? await prisma.guest.findFirst({ where: { eventId: event.id, phone } }) : null;
    if (existing) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: {
          isVendor: true, tier: "Vendor", status: "approved", deletedAt: null, email: vEmail,
          company: String(body.company || "").trim(),
          vendorRole: String(body.vendorRole || "").trim(),
          callTime: String(body.callTime || "").trim(),
          vendorNote: String(body.vendorNote || "").trim(),
        },
      });
      return NextResponse.json({ ok: true, updated: true });
    }

    let passId = generatePassId();
    while (await prisma.guest.findUnique({ where: { passId } })) passId = generatePassId();

    await prisma.guest.create({
      data: {
        eventId: event.id, passId,
        name: String(body.name).trim(),
        phone: phone || null,
        isVendor: true, tier: "Vendor", status: "approved", email: vEmail,
        company: String(body.company || "").trim(),
        vendorRole: String(body.vendorRole || "").trim(),
        callTime: String(body.callTime || "").trim(),
        vendorNote: String(body.vendorNote || "").trim(),
      },
    });
    const created = await prisma.guest.findUnique({ where: { passId } });

    // Which days this vendor works, each with its own call time
    const vDays = Array.isArray(body.vendorDays) ? body.vendorDays : [];
    const eventDays = await prisma.eventDay.findMany({ where: { eventId: event.id }, orderBy: { position: "asc" } });
    if (created && eventDays.length) {
      const rows = vDays.length
        ? eventDays.filter((d) => vDays.some((x: { dayId?: string }) => x && x.dayId === d.id))
            .map((d) => ({
              guestId: created.id,
              dayId: d.id,
              callTime: String(vDays.find((x: { dayId?: string; callTime?: string }) => x.dayId === d.id)?.callTime || "").trim(),
            }))
        : eventDays.map((d) => ({ guestId: created.id, dayId: d.id, callTime: String(body.callTime || "").trim() }));
      if (rows.length) await prisma.guestDay.createMany({ data: rows, skipDuplicates: true });
    }
    if (created) {
      await sendVendorBadgeEmail({
        to: vEmail, vendorName: created.name, eventTitle: event.title, slug: event.slug,
        passId: created.passId, vendorRole: created.vendorRole, company: created.company,
        callTime: created.callTime, vendorNote: created.vendorNote,
        loadInTime: event.loadInTime || "", eventDate: event.eventDate,
        eventDateISO: event.eventDateISO, eventTime: event.eventTime,
        venue: event.venue, address: event.address,
      });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    /* Scoped to this event and to crew. It was updating by id alone,
       so one valid admin key was enough to rewrite a vendor - or any
       guest - at somebody else's event, given only their id. */
    const r = await prisma.guest.updateMany({
      where: { id: String(body.id), eventId: event.id, isVendor: true },
      data: {
        name: body.name ? String(body.name).trim() : undefined,
        company: typeof body.company === "string" ? body.company.trim() : undefined,
        vendorRole: typeof body.vendorRole === "string" ? body.vendorRole.trim() : undefined,
        callTime: typeof body.callTime === "string" ? body.callTime.trim() : undefined,
        vendorNote: typeof body.vendorNote === "string" ? body.vendorNote.trim() : undefined,
        phone: typeof body.phone === "string" ? normPhone(body.phone) : undefined,
      },
    });
    if (!r.count) return NextResponse.json({ error: "Vendor not found on this event." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    /* the same scope, and it matters more here: unscoped, this was a
       way to remove any guest from any event on the platform */
    const r = await prisma.guest.updateMany({
      where: { id: String(body.id), eventId: event.id, isVendor: true },
      data: { deletedAt: new Date() },
    });
    if (!r.count) return NextResponse.json({ error: "Vendor not found on this event." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "brief") {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        vendorBrief: typeof body.vendorBrief === "string" ? body.vendorBrief.trim() || null : undefined,
        loadInTime: typeof body.loadInTime === "string" ? body.loadInTime.trim() || null : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
