import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaff, requireLevel } from "@/lib/staff";

export async function POST(req: NextRequest) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, eventId, userId, approval, note, paymentStatus, paymentAmount, level, email } = body;

  if (action === "review" && eventId) {
    await prisma.event.update({
      where: { id: String(eventId) },
      data: {
        approval: ["pending", "approved", "rejected", "suspended"].includes(approval) ? approval : "pending",
        approvedAt: approval === "approved" ? new Date() : null,
        approvedBy: approval === "approved" ? staff.name : null,
        reviewNote: typeof note === "string" ? note.trim() || null : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "payment") {
    if (!(await requireLevel("admin"))) return NextResponse.json({ error: "Admins only." }, { status: 403 });
    await prisma.event.update({
      where: { id: String(eventId) },
      data: {
        paymentStatus: ["unpaid", "paid", "partial"].includes(paymentStatus) ? paymentStatus : "unpaid",
        paymentAmount: paymentAmount ? Number(paymentAmount) : null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "setLevel") {
    if (!(await requireLevel("owner"))) return NextResponse.json({ error: "Owner only." }, { status: 403 });
    const target = userId
      ? await prisma.user.findUnique({ where: { id: String(userId) } })
      : await prisma.user.findUnique({ where: { email: String(email || "").toLowerCase().trim() } });

    if (!target) return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    if (target.email.toLowerCase() === (process.env.OWNER_EMAIL || "").toLowerCase()) {
      return NextResponse.json({ error: "The owner account cannot be changed." }, { status: 403 });
    }

    const lvl = ["admin", "reviewer", "none"].includes(level) ? level : "none";
    await prisma.user.update({
      where: { id: target.id },
      data: {
        isStaff: lvl !== "none",
        staffLevel: lvl,
        staffSince: lvl !== "none" ? new Date() : null,
        invitedBy: lvl !== "none" ? staff.email : null,
      },
    });
    return NextResponse.json({ ok: true, name: target.name, level: lvl });
  }

  if (action === "toggleSuspend") {
    if (!(await requireLevel("admin"))) return NextResponse.json({ error: "Admins only." }, { status: 403 });
    const u = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (u.email.toLowerCase() === (process.env.OWNER_EMAIL || "").toLowerCase()) {
      return NextResponse.json({ error: "The owner cannot be suspended." }, { status: 403 });
    }
    await prisma.user.update({ where: { id: u.id }, data: { suspended: !u.suspended } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
