import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { normPhone } from "@/lib/ids";

export async function POST(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { phone } = await req.json();
  const clean = normPhone(phone);
  if (!clean || clean.length < 7) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { phone: clean } });
  const count = await prisma.guest.count({ where: { phone: clean, deletedAt: null } });
  return NextResponse.json({ ok: true, found: count });
}
