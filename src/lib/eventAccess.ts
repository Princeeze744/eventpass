import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

// True if the request may manage this event:
// correct ADM key, OR signed-in owner, OR signed-in invited host.
export async function canManageEvent(event: { adminKey: string; ownerId: string; hostEmail?: string | null }, key: string): Promise<boolean> {
  if (event.adminKey === key) return true;
  const userId = await getSessionOrganizerId();
  if (!userId) return false;
  if (event.ownerId === userId) return true;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && event.hostEmail && user.email.toLowerCase() === event.hostEmail.toLowerCase()) return true;
  return false;
}