import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, adminKey, action } = body;

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
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
        fromName: String(body.fromName).trim(),
        giftType: body.giftType === "item" ? "item" : "cash",
        amount: body.amount ? Number(body.amount) : null,
        item: String(body.item || "").trim(),
        note: String(body.note || "").trim(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "thank") {
    const g = await prisma.gift.findUnique({ where: { id: String(body.id) } });
    if (g) await prisma.gift.update({ where: { id: g.id }, data: { thanked: !g.thanked } });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    await prisma.gift.delete({ where: { id: String(body.id) } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
