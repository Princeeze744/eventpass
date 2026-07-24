import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [events, users, guestCount] = await Promise.all([
    prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, email: true, phone: true, role: true } },
        _count: { select: { guests: true } },
      },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.guest.count({ where: { deletedAt: null } }),
  ]);

  const ownerEmail = (process.env.OWNER_EMAIL || "").toLowerCase();

  return NextResponse.json({
    me: { name: staff.name, email: staff.email, level: staff.level },
    totals: {
      events: events.length,
      pending: events.filter((e) => e.approval === "pending").length,
      approved: events.filter((e) => e.approval === "approved").length,
      planners: users.filter((u) => u.role === "planner" || u.role === "host").length,
      users: users.length,
      guests: guestCount,
      revenue: events.reduce((a, e) => a + (e.paymentAmount || 0), 0),
      staff: users.filter((u) => u.isStaff).length,
    },
    events: events.map((e) => ({
      id: e.id, slug: e.slug, title: e.title, eventType: e.eventType, eventDate: e.eventDate, venue: e.venue,
      approval: e.approval, reviewNote: e.reviewNote, approvedBy: e.approvedBy,
      paymentStatus: e.paymentStatus, paymentAmount: e.paymentAmount,
      createdAt: e.createdAt, guests: e._count.guests, owner: e.owner,
    })),
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      isStaff: u.isStaff,
      level: u.email.toLowerCase() === ownerEmail ? "owner" : (u.isStaff ? u.staffLevel || "reviewer" : "none"),
      suspended: u.suspended, createdAt: u.createdAt, staffSince: u.staffSince, invitedBy: u.invitedBy,
    })),
  });
}
