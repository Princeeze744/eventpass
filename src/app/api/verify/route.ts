import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { passId } = await req.json();
  if (!passId || typeof passId !== "string") {
    return NextResponse.json(
      { status: "invalid", message: "No pass ID provided." },
      { status: 400 }
    );
  }

  const guest = await prisma.guest.findFirst({
    where: { passId: { equals: passId.trim() } },
  });

  if (!guest || guest.status === "declined") {
    return NextResponse.json({
      status: "invalid",
      message: "This pass is not on the guest list.",
    });
  }

  if (guest.status === "pending") {
    return NextResponse.json({
      status: "pending",
      message: "Not approved by the couple.",
      guest: { name: guest.name, tier: guest.tier, table: guest.table },
    });
  }

  if (guest.checkedIn) {
    return NextResponse.json({
      status: "duplicate",
      message: "Pass already used.",
      guest: {
        name: guest.name,
        tier: guest.tier,
        table: guest.table,
        checkedInAt: guest.checkedInAt
          ? new Date(guest.checkedInAt).toLocaleTimeString()
          : undefined,
      },
    });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  return NextResponse.json({
    status: "valid",
    message: guest.checkedInOnline ? "Pre-checked in online." : "Welcome! Guest verified.",
    preChecked: guest.checkedInOnline,
    guest: { name: guest.name, tier: guest.tier, table: guest.table },
  });
}
