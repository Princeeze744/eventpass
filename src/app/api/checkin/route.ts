import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { passId } = await req.json();
  const guest = await prisma.guest.findFirst({
    where: { passId: { equals: (passId || "").trim() } },
  });

  if (!guest || guest.status === "declined") {
    return NextResponse.json({ error: "Pass not valid." }, { status: 404 });
  }
  if (guest.status !== "approved") {
    return NextResponse.json(
      { error: "Your pass is still pending approval." },
      { status: 403 }
    );
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { checkedInOnline: true },
  });
  return NextResponse.json({ ok: true });
}
