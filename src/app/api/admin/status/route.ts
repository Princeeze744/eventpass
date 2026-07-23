import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-key") !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status } = await req.json();
  if (!id || !["pending", "approved", "declined"].includes(status)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  await prisma.guest.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
