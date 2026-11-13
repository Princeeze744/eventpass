import { prisma } from "@/lib/db";

/* ------------------------------------------------------------------
   Rate limiting, on the database we already have.

   The usual answer is Redis. We do not need it: at a few hundred
   requests a minute a Postgres counter is comfortable, and it costs
   nothing extra and adds no service to keep alive.

   Why this matters more than it looks. A pass ID is 32 characters
   over 6 positions - about a billion combinations. That is plenty
   against a person and nothing at all against a script: with a few
   thousand live passes and no limit, a few hundred guesses a second
   finds a real one inside an hour, and a pass ID opens a guest's
   page. The same is true of admin and gate keys. A limit is what
   turns "an hour" into "never".

   Two rules it follows:

   - It is ATOMIC. The count is incremented inside one statement, so
     twenty simultaneous requests cannot all read "4" and write "5".

   - It FAILS OPEN. If the database is unreachable the request is
     allowed. A rate limiter that takes the gate offline mid-event
     has done more damage than the attack it was guarding against.
------------------------------------------------------------------ */

export type RateResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
};

export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<RateResult> {
  const expires = new Date(Date.now() + windowSeconds * 1000);

  try {
    const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
      INSERT INTO "RateLimit" ("id", "bucket", "count", "expiresAt")
      VALUES (${crypto.randomUUID()}, ${bucket}, 1, ${expires})
      ON CONFLICT ("bucket") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."expiresAt" < NOW() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "RateLimit"."expiresAt" < NOW() THEN ${expires}
          ELSE "RateLimit"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `;

    const row = rows[0];
    if (!row) return { ok: true, remaining: limit, retryAfter: 0 };

    /* sweep old rows occasionally rather than on a schedule - there is
       no cron here, and one delete in a hundred requests is enough */
    if (Math.random() < 0.01) {
      prisma.rateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(() => {});
    }

    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 1000)
    );

    return {
      ok: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      retryAfter,
    };
  } catch {
    /* never let the limiter be the thing that breaks the event */
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

/* The caller's address as Vercel presents it. x-forwarded-for can
   carry a chain; the first entry is the client. Falls back to a
   single shared bucket, which is deliberately strict rather than
   deliberately open. */
export function callerIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/* A 429 with the header a well-behaved client will respect. */
export function tooMany(retryAfter: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/* ------------------------------------------------------------------
   One place to keep the numbers, so they can be reasoned about
   together rather than scattered across twenty route files.

   Each is "requests per window, per caller". They are set generously
   enough that no real usher, host or guest will ever meet one, and
   tightly enough that a script meets one immediately.
------------------------------------------------------------------ */
export const LIMITS = {
  /* a guest looking up their own pass - a handful of attempts is
     human, hundreds is someone walking phone numbers */
  mypass: { limit: 10, window: 300 },

  /* the gate. An usher scans fast, so this is high - but a script
     guessing pass IDs is far higher still */
  verify: { limit: 240, window: 60 },

  /* registering. One person registers once */
  rsvp: { limit: 12, window: 600 },

  /* unlocking anything with a key - admin, gate. This is the one
     that makes guessing a key pointless */
  auth: { limit: 20, window: 300 },

  /* reading an event's live numbers */
  read: { limit: 120, window: 60 },

  /* anything that writes in bulk */
  write: { limit: 60, window: 60 },
} as const;
