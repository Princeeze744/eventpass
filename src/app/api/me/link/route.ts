import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { normPhone } from "@/lib/ids";
import { rateLimit, callerIp, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   Linking a phone number to an account.

   READ THIS BEFORE TRUSTING IT.

   Whatever number is set here, /api/me/events will then return every
   guest record carrying it - across every event on the platform, pass
   IDs included. And a pass ID opens a pass.

   Nothing verifies that the number belongs to the person typing it.
   So anyone can create an account, enter somebody else's number, and
   collect that person's entry passes for every event they are
   registered to.

   That cannot be fixed with a filter. The fix is a one-time code sent
   to the number and a phoneVerifiedAt column to record that it was
   answered - a day's work, and the single most important thing left
   on this platform.

   Until then: three changes per day, and a number already claimed by
   another account is refused. The first makes sweeping through a
   range of numbers impractical; the second means a number cannot be
   taken from an account that already holds it. Neither is a
   substitute for verifying.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const userId = await getSessionOrganizerId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const ip = callerIp(req);
  const byIp = await rateLimit(`melink:${ip}`, 5, 86400);
  if (!byIp.ok) return tooMany(byIp.retryAfter);

  /* and against the account, so a fleet of addresses behind one
     sign-in cannot do what one address cannot */
  const byUser = await rateLimit(`melink-u:${userId}`, 3, 86400);
  if (!byUser.ok) return tooMany(byUser.retryAfter);

  const { phone } = await req.json().catch(() => ({}));
  const clean = normPhone(phone);
  if (!clean || clean.length < 7) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const taken = await prisma.user.findFirst({
    where: { phone: clean, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json(
      { error: "That number is already linked to another account. Contact the organiser if this is yours." },
      { status: 409 }
    );
  }

  await prisma.user.update({ where: { id: userId }, data: { phone: clean } });
  const count = await prisma.guest.count({ where: { phone: clean, deletedAt: null } });
  return NextResponse.json({ ok: true, found: count });
}
