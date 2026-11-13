import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

/* ------------------------------------------------------------------
   The secret every session cookie on this platform is signed with.

   It used to fall back to the literal string "dev-secret-change-me",
   which lives in a repository. If AUTH_SECRET were ever missing in
   production, anybody reading that repository could mint a valid
   session for any account on the platform - staff included - simply
   by signing a token with a secret they could see. Nothing would look
   wrong; the cookie would verify perfectly.

   The fallback is now random, and regenerated whenever the process
   starts. A missing AUTH_SECRET therefore breaks sessions on every
   deploy, which is loud, annoying, and infinitely preferable to a
   platform anybody can sign themselves into.
------------------------------------------------------------------ */
const SECRET =
  process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");

const COOKIE = "sb_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

/* A plain !== returns as soon as two strings differ, so how long the
   comparison takes leaks how much of the signature was correct. Over
   enough attempts that is a signature, one character at a time.
   timingSafeEqual always reads both buffers to the end. */
function sameSignature(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function createToken(organizerId: string) {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `${organizerId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, sig] = parts;
  if (!sameSignature(sign(`${id}.${expires}`), sig)) return null;
  if (Date.now() > Number(expires)) return null;
  return id;
}

/* ------------------------------------------------------------------
   A token alone is not enough to say somebody may act.

   A cookie is good for thirty days and says nothing about what has
   happened since it was issued. Suspending an account did nothing to
   anybody already signed in, and deleting one left a token that still
   named a row that was gone. The suspension check added at sign-in
   this afternoon was worth very little on its own, because the person
   you want to stop already has their cookie.

   The cost is one primary-key lookup per authenticated request. On a
   platform this size that is the right trade: a suspension that does
   not take effect until next month is not a suspension.
------------------------------------------------------------------ */
export async function getSessionOrganizerId(): Promise<string | null> {
  const store = await cookies();
  const id = readToken(store.get(COOKIE)?.value);
  if (!id) return null;

  /* imported here rather than at the top, the way getSessionUser
     already does, to keep this module free of a circular import */
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user
    .findUnique({ where: { id }, select: { id: true, suspended: true } })
    .catch(() => null);

  if (!user || user.suspended) return null;
  return user.id;
}

export async function getSessionUser() {
  const id = await getSessionOrganizerId();
  if (!id) return null;
  const { prisma } = await import("@/lib/db");
  return prisma.user.findUnique({ where: { id } });
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;
