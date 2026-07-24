import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

export type StaffLevel = "owner" | "admin" | "reviewer" | "none";

export const LEVELS: Record<string, number> = { owner: 3, admin: 2, reviewer: 1, none: 0 };

export async function getStaff() {
  const id = await getSessionOrganizerId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const ownerEmail = (process.env.OWNER_EMAIL || "").toLowerCase();
  const level: StaffLevel =
    user.email.toLowerCase() === ownerEmail ? "owner"
    : (user.isStaff ? (user.staffLevel as StaffLevel) || "reviewer" : "none");

  if (level === "none") return null;
  return { ...user, level };
}

export async function requireLevel(min: StaffLevel) {
  const staff = await getStaff();
  if (!staff) return null;
  if (LEVELS[staff.level] < LEVELS[min]) return null;
  return staff;
}
