import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normPhone, generatePassId } from "@/lib/match";

function authorized(req: NextRequest): boolean {
  return req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
}

// GET — full guest list for the admin terminal
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ guests });
}

// POST — bulk upload: lines of "Name, Phone"
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { list } = await req.json();
  if (!list || typeof list !== "string") {
    return NextResponse.json({ error: "No list provided." }, { status: 400 });
  }

  const lines = list
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let added = 0;
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const name = parts[0];
    const phone = normPhone(parts[1] || "");
    if (!name || name.length < 2) {
      skipped++;
      continue;
    }

    const exists = await prisma.guest.findFirst({
      where: phone
        ? { OR: [{ phone }, { name: { equals: name } }] }
        : { name: { equals: name } },
    });
    if (exists) {
      skipped++;
      continue;
    }

    let passId = generatePassId();
    while (await prisma.guest.findUnique({ where: { passId } })) {
      passId = generatePassId();
    }

    await prisma.guest.create({
      data: { passId, name, phone: phone || null },
    });
    added++;
  }

  return NextResponse.json({ added, skipped, total: lines.length });
}
