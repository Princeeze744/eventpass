import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone } from "@/lib/match";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  const cleanPhone = normPhone(phone);

  if (!cleanPhone || cleanPhone.length < 7) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  const guest = await prisma.guest.findFirst({
    where: { phone: cleanPhone },
  });

  if (!guest) {
    return NextResponse.json(
      { error: "No registration found for this number. Have you registered yet?" },
      { status: 404 }
    );
  }

  return NextResponse.json({ passId: guest.passId });
}
