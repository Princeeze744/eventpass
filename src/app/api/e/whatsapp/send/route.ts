import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent } from "@/lib/eventAccess";
import {
  sendTemplate,
  normalizePhone,
  whatsappConfigured,
  whatsappDiagnostics,
  FatalWhatsAppError,
  sleep,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEMPLATE = process.env.WHATSAPP_TEMPLATE_NAME || "event_invite";
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://storyboxnigeria.com";

/* Meta's rolling-24h cap for an unverified business */
const DAILY_CAP = 250;

/* how many we attempt per request - keeps us well inside the function
   timeout, and lets the dashboard show real progress */
const BATCH = 20;

/* Vendors are never sent a guest invitation. A guest invitation says
   "we are delighted to confirm your attendance" and carries an entry
   pass; a vendor needs a call time and a load-in brief, which is a
   different message entirely. Sending one to a caterer is both wrong
   and billable, so they are excluded at the query rather than filtered
   later - that way the dashboard counts and the send list can never
   drift apart. */
const GUESTS_ONLY = { isVendor: false } as const;

type Row = {
  id: string;
  name: string;
  phone: string | null;
  passId: string;
  waStatus: string;
};

export async function POST(req: Request) {
  let body: { slug?: string; key?: string; dryRun?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const slug = String(body.slug || "").trim();
  const key = String(body.key || "");
  if (!slug) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({ where: { slug, deletedAt: null } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!(await canManageEvent(event, key))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (!whatsappConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp is not connected yet. Add the token and phone ID first." },
      { status: 400 }
    );
  }

  /* ---- who still needs sending ---- */
  const all = (await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY },
    select: { id: true, name: true, phone: true, passId: true, waStatus: true },
    orderBy: { createdAt: "asc" },
  })) as Row[];

  const alreadyOk = (s: string) =>
    s === "sent" || s === "delivered" || s === "read";

  const withPhone = all.filter((g) => normalizePhone(g.phone));
  const noPhone = all.length - withPhone.length;
  const done = withPhone.filter((g) => alreadyOk(g.waStatus));
  const pending = withPhone.filter((g) => !alreadyOk(g.waStatus));

  /* ---- Meta's rolling 24h window ---- */
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentLast24h = await prisma.guest.count({
    where: {
      eventId: event.id,
      deletedAt: null,
      ...GUESTS_ONLY,
      waSentAt: { gte: since },
      waStatus: { in: ["sent", "delivered", "read"] },
    },
  });
  const headroom = Math.max(0, DAILY_CAP - sentLast24h);

  if (body.dryRun) {
    return NextResponse.json({
      dryRun: true,
      total: all.length,
      withPhone: withPhone.length,
      noPhone,
      alreadySent: done.length,
      pending: pending.length,
      sentLast24h,
      headroom,
      template: TEMPLATE,
    });
  }

  if (headroom === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      remaining: pending.length,
      capReached: true,
      sentLast24h,
      message:
        "Daily limit of 250 reached. The rest can go out once 24 hours have passed.",
    });
  }

  const slice = pending.slice(0, Math.min(BATCH, headroom));

  let sent = 0;
  let failed = 0;
  const errors: { name: string; phone: string; error: string }[] = [];
  let fatal: string | null = null;

  for (const g of slice) {
    const cardUrl = `${SITE}/e/${encodeURIComponent(event.slug)}/card/${encodeURIComponent(
      g.passId
    )}`;

    try {
      const r = await sendTemplate({
        to: g.phone || "",
        template: TEMPLATE,
        lang: LANG,
        imageUrl: cardUrl,
        bodyParams: [
          g.name,
          event.title,
          event.eventDate,
          event.eventTime,
          event.venue,
        ],
      });

      if (r.ok) {
        sent++;
        await prisma.guest.update({
          where: { id: g.id },
          data: {
            waMessageId: r.messageId,
            waStatus: "sent",
            waSentAt: new Date(),
            waError: null,
          },
        });
      } else {
        failed++;
        errors.push({ name: g.name, phone: r.to, error: r.error });
        await prisma.guest.update({
          where: { id: g.id },
          data: { waStatus: "failed", waError: r.error.slice(0, 300) },
        });
      }
    } catch (e) {
      /* account-level problem - stop the run, don't burn the rest */
      if (e instanceof FatalWhatsAppError) {
        fatal = e.message;
        break;
      }
      failed++;
      errors.push({
        name: g.name,
        phone: g.phone || "",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }

    /* be polite to Meta */
    await sleep(120);
  }

  const remaining = pending.length - sent;

  return NextResponse.json({
    sent,
    failed,
    remaining,
    done: remaining === 0,
    noPhone,
    alreadySent: done.length + sent,
    sentLast24h: sentLast24h + sent,
    headroom: Math.max(0, headroom - sent),
    errors: errors.slice(0, 10),
    fatal,
  });
}

/* quick status read for the dashboard */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = String(url.searchParams.get("slug") || "").trim();
  const key = String(url.searchParams.get("key") || "");
  if (!slug) return NextResponse.json({ error: "Missing event" }, { status: 400 });

  const event = await prisma.event.findFirst({ where: { slug, deletedAt: null } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!(await canManageEvent(event, key)))
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id, deletedAt: null, ...GUESTS_ONLY },
    select: { phone: true, waStatus: true, rsvpAnswer: true },
  });

  /* counted separately so the host can see vendors are deliberately
     excluded rather than missing */
  const vendors = await prisma.guest.count({
    where: { eventId: event.id, deletedAt: null, isVendor: true },
  });

  const counts = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0, noPhone: 0 };
  for (const g of guests) {
    if (!normalizePhone(g.phone)) {
      counts.noPhone++;
      continue;
    }
    switch (g.waStatus) {
      case "sent":
        counts.sent++;
        break;
      case "delivered":
        counts.delivered++;
        break;
      case "read":
        counts.read++;
        break;
      case "failed":
        counts.failed++;
        break;
      default:
        counts.pending++;
    }
  }

  return NextResponse.json({
    total: guests.length,
    vendors,
    configured: whatsappConfigured(),
    diagnostics: whatsappDiagnostics(),
    template: TEMPLATE,
    site: SITE,
    ...counts,
  });
}
