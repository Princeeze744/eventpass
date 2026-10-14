import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   GET - Meta's one-time verification handshake.
   Paste the same value into Meta's "Verify token" field as you set in
   the WHATSAPP_VERIFY_TOKEN env var.
------------------------------------------------------------------ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";

  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ------------------------------------------------------------------
   POST - delivery receipts and button taps.

   Always answer 200 quickly. If we return an error Meta retries, and
   repeated failures get the webhook disabled - which would silently
   kill our status tracking mid-event.
------------------------------------------------------------------ */
export async function POST(req: Request) {
  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value || {};

        /* ---------- delivery status ---------- */
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const s of statuses) {
          const id = String(s?.id || "");
          const status = String(s?.status || "");
          if (!id || !status) continue;

          /* never walk a status backwards - Meta can deliver these out of
             order, and "sent" arriving after "read" would lose the read */
          const rank: Record<string, number> = {
            sent: 1,
            delivered: 2,
            read: 3,
          };
          const incoming = rank[status];

          const guest = await prisma.guest.findFirst({
            where: { waMessageId: id },
            select: { id: true, waStatus: true },
          });
          if (!guest) continue;

          if (status === "failed") {
            const reason =
              s?.errors?.[0]?.title ||
              s?.errors?.[0]?.message ||
              "Delivery failed";
            await prisma.guest.update({
              where: { id: guest.id },
              data: { waStatus: "failed", waError: String(reason).slice(0, 300) },
            });
            continue;
          }

          const current = rank[guest.waStatus] || 0;
          if (incoming && incoming > current) {
            await prisma.guest.update({
              where: { id: guest.id },
              data: { waStatus: status },
            });
          }
        }

        /* ---------- incoming messages, including button taps ---------- */
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const m of messages) {
          const from = normalizePhone(String(m?.from || ""));
          if (!from) continue;

          /* quick-reply buttons on a template arrive as type "button" */
          let label = "";
          if (m?.type === "button") {
            label = String(m?.button?.text || m?.button?.payload || "");
          } else if (m?.type === "interactive") {
            label = String(
              m?.interactive?.button_reply?.title ||
                m?.interactive?.list_reply?.title ||
                ""
            );
          }
          if (!label) continue;

          const yes = /\b(be there|attend|yes|coming|i'?ll)\b/i.test(label);
          const no = /\b(can'?t|cannot|sorry|no|unable)\b/i.test(label);
          if (!yes && !no) continue;

          /* match the guest by the last 10 digits, so stored formats
             like 0803..., +234803... and 234803... all find each other */
          const tail = from.slice(-10);
          const candidates = await prisma.guest.findMany({
            where: { deletedAt: null, phone: { not: null } },
            select: { id: true, phone: true, waSentAt: true },
            orderBy: { waSentAt: "desc" },
            take: 2000,
          });

          const match = candidates.find(
            (g) => (normalizePhone(g.phone) || "").slice(-10) === tail
          );
          if (!match) continue;

          await prisma.guest.update({
            where: { id: match.id },
            data: {
              rsvpAnswer: yes ? "yes" : "no",
              ...(no ? { declinedAt: new Date() } : { declinedAt: null }),
            },
          });
        }
      }
    }
  } catch {
    /* swallow - a 500 here makes Meta retry and eventually disable us */
  }

  return NextResponse.json({ ok: true });
}
