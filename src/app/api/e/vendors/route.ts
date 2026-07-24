import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, adminKey, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (adminKey !== event.adminKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "list") {
    const vendors = await prisma.guest.findMany({
      where: { eventId: event.id, isVendor: true, deletedAt: null },
      orderBy: { callTime: "asc" },
    });
    return NextResponse.json({
      event: { title: event.title, vendorBrief: event.vendorBrief, loadInTime: event.loadInTime },
      vendors: vendors.map((v) => ({
        id: v.id, passId: v.passId, name: v.name, phone: v.phone,
        company: v.company, vendorRole: v.vendorRole, callTime: v.callTime,
        vendorNote: v.vendorNote, status: v.status, checkedIn: v.checkedIn,
        checkedInAt: v.checkedInAt ? new Date(v.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      })),
    });
  }

  if (action === "add") {
    const phone = normPhone(body.phone);
    if (!body.name || String(body.name).trim().length < 2) {
      return NextResponse.json({ error: "Enter the vendor name." }, { status: 400 });
    }

    const existing = phone ? await prisma.guest.findFirst({ where: { eventId: event.id, phone } }) : null;
    if (existing) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: {
          isVendor: true, tier: "Vendor", status: "approved", deletedAt: null,
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
        isVendor: true, tier: "Vendor", status: "approved",
        company: String(body.company || "").trim(),
        vendorRole: String(body.vendorRole || "").trim(),
        callTime: String(body.callTime || "").trim(),
        vendorNote: String(body.vendorNote || "").trim(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    await prisma.guest.update({
      where: { id: String(body.id) },
      data: {
        name: body.name ? String(body.name).trim() : undefined,
        company: typeof body.company === "string" ? body.company.trim() : undefined,
        vendorRole: typeof body.vendorRole === "string" ? body.vendorRole.trim() : undefined,
        callTime: typeof body.callTime === "string" ? body.callTime.trim() : undefined,
        vendorNote: typeof body.vendorNote === "string" ? body.vendorNote.trim() : undefined,
        phone: typeof body.phone === "string" ? normPhone(body.phone) : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    await prisma.guest.update({ where: { id: String(body.id) }, data: { deletedAt: new Date() } });
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
