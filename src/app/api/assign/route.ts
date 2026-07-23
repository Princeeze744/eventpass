import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { passId, table, usherKey } = await req.json();

  if (usherKey !== process.env.NEXT_PUBLIC_USHER_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!passId || typeof table !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const guest = await prisma.guest.findFirst({
    where: { passId: { equals: passId.trim() } },
  });
  if (!guest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { table: table.trim() || "TBA" },
  });

  return NextResponse.json({ ok: true, table: table.trim() });
}
