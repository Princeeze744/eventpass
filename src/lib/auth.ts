import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
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
  if (sign(`${id}.${expires}`) !== sig) return null;
  if (Date.now() > Number(expires)) return null;
  return id;
}

export async function getSessionOrganizerId(): Promise<string | null> {
  const store = await cookies();
  return readToken(store.get(COOKIE)?.value);
}

export async function getSessionUser() {
  const id = await getSessionOrganizerId();
  if (!id) return null;
  const { prisma } = await import("@/lib/db");
  return prisma.user.findUnique({ where: { id } });
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;
