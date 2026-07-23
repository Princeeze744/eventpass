import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-key") !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, tier, table } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const data: { tier?: string; table?: string } = {};
  if (typeof tier === "string" && ["VIP Guest", "Family", "Guest"].includes(tier)) {
    data.tier = tier;
  }
  if (typeof table === "string") {
    data.table = table.trim() || "TBA";
  }

  await prisma.guest.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
