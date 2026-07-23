import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [total, checkedInGuests] = await Promise.all([
    prisma.guest.count(),
    prisma.guest.findMany({
      where: { checkedIn: true },
      orderBy: { checkedInAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    total,
    checkedIn: checkedInGuests.length,
    vipsIn: checkedInGuests.filter((g) => g.tier === "VIP Guest").length,
    recent: checkedInGuests.slice(0, 8).map((g) => ({
      name: g.name,
      tier: g.tier,
      table: g.table,
      time: g.checkedInAt ? new Date(g.checkedInAt).toLocaleTimeString() : "",
    })),
  });
}
