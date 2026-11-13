import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = callerIp(req);
  const gate = await rateLimit(`gifts:${ip}`, LIMITS.write.limit, LIMITS.write.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const body = await req.json().catch(() => ({}));
  const { slug, adminKey, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || !(await canManageEvent(event, String(adminKey || "")))) {
    const guess = await rateLimit(`gifts-auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.window);
    if (!guess.ok) return tooMany(guess.retryAfter);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (action === "list") {
    const gifts = await prisma.gift.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({
      gifts,
      totals: {
        count: gifts.length,
        cash: gifts.filter((g) => g.giftType === "cash").reduce((a, g) => a + (g.amount || 0), 0),
        items: gifts.filter((g) => g.giftType === "item").length,
        thanked: gifts.filter((g) => g.thanked).length,
      },
    });
  }

  if (action === "add") {
    if (!body.fromName || String(body.fromName).trim().length < 2) {
      return NextResponse.json({ error: "Enter who the gift is from." }, { status: 400 });
    }
    await prisma.gift.create({
      data: {
        eventId: event.id,
        fromName: String(body.fromName).trim().slice(0, 120),
        giftType: body.giftType === "item" ? "item" : "cash",
        amount: body.amount ? Number(body.amount) : null,
        item: String(body.item || "").trim().slice(0, 300),
        note: String(body.note || "").trim().slice(0, 1000),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "thank") {
    /* scoped to this event: it was fetched by id alone, so one valid
       admin key could toggle a gift record at somebody else's event */
    const g = await prisma.gift.findFirst({ where: { id: String(body.id), eventId: event.id } });
    if (!g) return NextResponse.json({ error: "Gift not found on this event." }, { status: 404 });
    await prisma.gift.update({ where: { id: g.id }, data: { thanked: !g.thanked } });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    /* and the same here, where it was a way to delete a record of
       money received at an event that was not yours */
    const r = await prisma.gift.deleteMany({ where: { id: String(body.id), eventId: event.id } });
    if (!r.count) return NextResponse.json({ error: "Gift not found on this event." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
