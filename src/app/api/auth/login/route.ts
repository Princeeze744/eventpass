import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { rateLimit, callerIp, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   Sign in.

   The single most valuable endpoint to guess at, and it had nothing
   stopping anyone. A password of ordinary strength falls to an
   unlimited script in hours.

   Two budgets, because the two attacks are different shapes:

   - per ADDRESS, against someone trying many passwords on one
     account, or many accounts from one machine
   - per EMAIL, against the same account being attacked from a
     hundred addresses at once, which the first budget never sees

   Ten in fifteen minutes is far more than anyone who has simply
   forgotten which password they used, and far less than any attempt
   on a password needs.

   The reply is deliberately the same whether the email exists or the
   password was wrong. Telling the two apart hands over a list of who
   holds an account here, which is worth having on its own.
------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const clean = String(email || "").trim().toLowerCase();

  const ip = callerIp(req);
  const byIp = await rateLimit(`login:${ip}`, 10, 900);
  if (!byIp.ok) return tooMany(byIp.retryAfter);

  if (clean) {
    const byEmail = await rateLimit(`login-em:${clean}`, 10, 900);
    if (!byEmail.ok) return tooMany(byEmail.retryAfter);
  }

  const user = await prisma.user.findUnique({ where: { email: clean } });
  if (!user || !(await verifyPassword(String(password || ""), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.suspended) {
    return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
