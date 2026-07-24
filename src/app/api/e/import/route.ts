import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/ids";

const TIERS = ["Guest", "Family", "VIP", "Vendor"];

export async function POST(req: NextRequest) {
  const { slug, adminKey, list, autoApprove } = await req.json();

  const event = await prisma.event.findUnique({ where: { slug: String(slug || "") } });
  if (!event || adminKey !== event.adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!list || typeof list !== "string") {
    return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
  }

  const lines = String(list).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const line of lines) {
    const parts = line.split(/[,\t;]/).map((p) => p.trim());
    const name = parts[0];
    const phone = normPhone(parts[1] || "");
    const rawTier = (parts[2] || "").toLowerCase();
    const tier =
      rawTier.startsWith("vip") ? "VIP"
      : rawTier.startsWith("fam") ? "Family"
      : rawTier.startsWith("ven") ? "Vendor"
      : "Guest";
    const partySize = Math.max(1, Math.min(10, Number(parts[3]) || 1));

    if (!name || name.length < 2) {
      skipped++;
      continue;
    }
    if (/^(name|guest)$/i.test(name)) {
      skipped++;
      continue;
    }

    const exists = await prisma.guest.findFirst({
      where: {
        eventId: event.id,
        OR: phone ? [{ phone }, { name: { equals: name, mode: "insensitive" } }] : [{ name: { equals: name, mode: "insensitive" } }],
      },
    });
    if (exists) {
      if (exists.deletedAt) {
        await prisma.guest.update({ where: { id: exists.id }, data: { deletedAt: null } });
        added++;
      } else {
        skipped++;
      }
      continue;
    }

    let passId = generatePassId();
    while (await prisma.guest.findUnique({ where: { passId } })) passId = generatePassId();

    try {
      await prisma.guest.create({
        data: {
          eventId: event.id,
          passId,
          name,
          phone: phone || null,
          tier: TIERS.includes(tier) ? tier : "Guest",
          partySize,
          status: autoApprove ? "approved" : "pending",
        },
      });
      added++;
    } catch {
      errors.push(name);
      skipped++;
    }
  }

  return NextResponse.json({ added, skipped, total: lines.length, errors: errors.slice(0, 5) });
}
