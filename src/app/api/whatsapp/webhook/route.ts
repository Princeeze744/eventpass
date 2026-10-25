import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, sendText } from "@/lib/whatsapp";

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
   Reading a guest's answer.

   Two sources, two levels of strictness.

   A quick-reply BUTTON carries one of our own fixed labels, so loose
   matching is safe and generous.

   A TYPED message is a human writing whatever they like, so it must
   match a short answer exactly. "No problem, thank you!" starts with
   "no" and must never be recorded as a decline - which is why the
   typed patterns are anchored to the whole message rather than
   searched inside it. Anything we are not sure about is ignored.
------------------------------------------------------------------ */
const BUTTON_YES = /\b(be there|attend|yes|coming|i'?ll)\b/i;
const BUTTON_NO = /\b(can'?t|cannot|sorry|no|unable)\b/i;

const TEXT_YES =
  /^(yes|yeah|yep|yes please|i'?ll be there|i will be there|i'?m coming|i am coming|coming|attending|confirm|confirmed|count me in)$/i;
const TEXT_NO =
  /^(no|nope|can'?t make it|i can'?t make it|cannot make it|i cannot make it|not coming|won'?t make it|i won'?t make it|sorry i can'?t make it|decline|unable to attend)$/i;

/* ------------------------------------------------------------------
   The reply a guest receives the moment they answer.

   These guests are often the organiser's most important invitees, and
   this message is the only thing the platform ever says to them in
   its own voice. It is written to sound like a gracious host rather
   than a system: warm, unhurried, and never instructing.

   Two constraints shape the wording:

   - WhatsApp greys out a quick-reply button permanently once tapped,
     so we must not invite a guest to tap it again. Replying with a
     word is the only route that still works.
   - "we" here is the organiser, not Story Box. The platform is
     invisible; the host is the one speaking.
------------------------------------------------------------------ */
function confirmationText(opts: {
  firstName: string;
  attending: boolean;
  title: string;
  date: string;
  time: string;
  venue: string;
}): string {
  const who = opts.firstName ? `, ${opts.firstName}` : "";

  if (opts.attending) {
    const lines = [
      `Thank you${who}. We are delighted to confirm your attendance at ${opts.title}.`,
      "",
    ];

    const when = [opts.date, opts.time].filter(Boolean).join(" at ");
    if (when) lines.push(when);
    if (opts.venue) lines.push(opts.venue);
    if (when || opts.venue) lines.push("");

    lines.push(
      "The personal invitation card above is your entry pass - please keep it safe. Kindly present the QR code at the entrance, where our team will be pleased to welcome you."
    );
    lines.push("");
    lines.push(
      "Should your plans change, simply reply NO and we will gladly update your reservation."
    );
    lines.push("");
    lines.push("It will be our pleasure to host you.");

    return lines.join("\n");
  }

  return [
    `Thank you for letting us know${who}, and for the courtesy of your reply.`,
    "",
    `You will be greatly missed at ${opts.title}.`,
    "",
    "Should your plans change, kindly reply YES and we will be delighted to reserve your place once more.",
    "",
    "We hope to have the pleasure of welcoming you on another occasion.",
  ].join("\n");
}

/* ------------------------------------------------------------------
   POST - delivery receipts, button taps and typed answers.

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

        /* ---------- button taps and typed answers ---------- */
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const m of messages) {
          const from = normalizePhone(String(m?.from || ""));
          if (!from) continue;

          let label = "";
          let typed = false;

          if (m?.type === "button") {
            /* quick-reply buttons on a template arrive as type "button" */
            label = String(m?.button?.text || m?.button?.payload || "");
          } else if (m?.type === "interactive") {
            label = String(
              m?.interactive?.button_reply?.title ||
                m?.interactive?.list_reply?.title ||
                ""
            );
          } else if (m?.type === "text") {
            /* a guest changing their mind - the button is greyed out by
               now, so a typed word is the only way back */
            label = String(m?.text?.body || "");
            typed = true;
          }
          if (!label.trim()) continue;

          let yes: boolean;
          let no: boolean;

          if (typed) {
            const t = label.trim().replace(/[.!,]+$/, "");
            yes = TEXT_YES.test(t);
            no = TEXT_NO.test(t);
          } else {
            yes = BUTTON_YES.test(label);
            no = BUTTON_NO.test(label);
          }

          /* neither matched, or both did - say nothing rather than guess */
          if (yes === no) continue;

          /* match the guest by the last 10 digits, so stored formats
             like 0803..., +234803... and 234803... all find each other */
          const tail = from.slice(-10);
          const candidates = await prisma.guest.findMany({
            /* crew are never sent a guest invitation, so a message from a
               vendor's number is not an RSVP - matching one would record
               an answer nobody gave and reply with a guest confirmation */
            where: { deletedAt: null, isVendor: false, phone: { not: null } },
            select: { id: true, phone: true, waSentAt: true },
            orderBy: { waSentAt: "desc" },
            take: 2000,
          });

          const match = candidates.find(
            (g) => (normalizePhone(g.phone) || "").slice(-10) === tail
          );
          if (!match) continue;

          const updated = await prisma.guest.update({
            where: { id: match.id },
            data: {
              rsvpAnswer: yes ? "yes" : "no",
              ...(no ? { declinedAt: new Date() } : { declinedAt: null }),
            },
            select: { name: true, phone: true, eventId: true },
          });

          /* ---------- courtesy reply ----------
             Wrapped so that a failure here can never cost us the status
             updates above, and can never make us answer Meta with a 500. */
          try {
            const ev = await prisma.event.findUnique({
              where: { id: updated.eventId },
              select: {
                title: true,
                eventDate: true,
                eventTime: true,
                venue: true,
              },
            });

            if (ev) {
              const firstName = String(updated.name || "")
                .trim()
                .split(/\s+/)[0];

              await sendText({
                to: updated.phone || from,
                body: confirmationText({
                  firstName,
                  attending: yes,
                  title: ev.title || "the event",
                  date: ev.eventDate || "",
                  time: ev.eventTime || "",
                  venue: ev.venue || "",
                }),
              });
            }
          } catch {
            /* swallow - the RSVP is already recorded, which is what matters */
          }
        }
      }
    }
  } catch {
    /* swallow - the RSVP is already recorded, which is what matters */
  }

  return NextResponse.json({ ok: true });
}
