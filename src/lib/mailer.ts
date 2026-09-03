import { Resend } from "resend";

const FROM = "Story Box <hello@storyboxnigeria.com>";
const SITE = "https://storyboxnigeria.com";
const LOGO = `${SITE}/brand/logo-white.jpg`;

/* ------------------------------------------------------------------ */
/*  Shared shell                                                       */
/* ------------------------------------------------------------------ */

function shell(inner: string, footer = "Port Harcourt, Nigeria &mdash; A Story Box Experience") {
  return `
  <div style="margin:0;padding:0;background:#080807;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
      <div style="text-align:center;padding-bottom:14px;">
        <img src="${LOGO}" alt="Story Box" width="48" height="48"
             style="display:block;margin:0 auto 10px;width:48px;height:48px;border-radius:12px;background:#f5f1ea;" />
        <span style="display:inline-block;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#c9a227;">Story Box</span>
      </div>
      ${inner}
      <p style="text-align:center;margin-top:24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(245,241,234,0.3);">
        ${footer}
      </p>
    </div>
  </div>`;
}

function card(inner: string) {
  return `<div style="background:linear-gradient(180deg,#141311,#0b0a09);border:1px solid rgba(201,162,39,0.25);border-radius:24px;padding:40px 32px;text-align:center;">${inner}</div>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:28px;background:#c9a227;color:#080807;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;padding:14px 34px;border-radius:999px;">${label}</a>`;
}

function rule() {
  return `<div style="width:60px;height:1px;background:#c9a227;margin:20px auto;"></div>`;
}

function detailRow(label: string, value: string) {
  if (!value) return "";
  return `<p style="margin:6px 0 0;font-size:13px;color:rgba(245,241,234,0.6);">
    <span style="color:rgba(245,241,234,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;">${label}</span><br/>${value}
  </p>`;
}

/* ------------------------------------------------------------------ */
/*  Calendar file                                                      */
/* ------------------------------------------------------------------ */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsStamp(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

/** Turns "2:00 PM" into { h: 14, m: 0 }. Falls back to midday. */
function parseTime(t: string) {
  const m = String(t || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return { h: 12, m: 0 };
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return { h, m: min };
}

function esc(s: string) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Builds an .ics calendar file for an event.
 * Returns null when there is no usable date, so callers can skip the attachment.
 */
export function buildIcs(opts: {
  title: string;
  eventDateISO: string;
  eventTime: string;
  venue: string;
  address?: string;
  passUrl: string;
  uid: string;
}) {
  if (!opts.eventDateISO) return null;

  const base = new Date(opts.eventDateISO);
  if (isNaN(base.getTime())) return null;

  const { h, m } = parseTime(opts.eventTime);
  const start = new Date(base);
  start.setHours(h, m, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 6);

  const location = [opts.venue, opts.address].filter(Boolean).join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Story Box//Event Experience Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@storyboxnigeria.com`,
    `DTSTAMP:${toIcsStamp(new Date())}`,
    `DTSTART:${toIcsStamp(start)}`,
    `DTEND:${toIcsStamp(end)}`,
    `SUMMARY:${esc(opts.title)}`,
    location ? `LOCATION:${esc(location)}` : "",
    `DESCRIPTION:${esc("Your pass: " + opts.passUrl)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(opts.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/* ------------------------------------------------------------------ */
/*  Welcome on signup                                                  */
/* ------------------------------------------------------------------ */

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);

  const roleLine =
    role === "planner" ? "You can now create events, send digital invitations, manage guests and run the gate."
    : role === "host" ? "You can now watch your guest list fill up, approve who attends, and enjoy your day."
    : role === "vendor" ? "You will receive your call times, briefs and venue access for the events you serve."
    : "You can now register for events and receive your verified digital passes.";

  const html = shell(
    card(`
      <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;color:#f5f1ea;">Welcome, ${name.split(" ")[0]}.</h1>
      ${rule()}
      <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
        Your Story Box account is ready. ${roleLine}
      </p>
      ${button(`${SITE}/dashboard`, "Open my dashboard")}
    `)
  );

  try {
    await resend.emails.send({ from: FROM, to, subject: "Welcome to Story Box", html });
  } catch (e) {
    console.error("Welcome email failed (signup still succeeded):", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Host invitation                                                    */
/* ------------------------------------------------------------------ */

export async function sendHostInviteEmail(to: string, eventTitle: string, plannerName: string, slug: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);

  const html = shell(
    card(`
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(245,241,234,0.5);">You have been invited to host</p>
      <h1 style="margin:14px 0 0;font-family:Georgia,serif;font-size:28px;color:#f5f1ea;">${eventTitle}</h1>
      ${rule()}
      <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
        ${plannerName} has set up your event on Story Box and invited you as the host.
        Sign in (or create your free account) with this email address and your event
        will be waiting on your dashboard &mdash; live guest counts, seating, gifts, everything.
      </p>
      ${button(`${SITE}/signup`, "Claim my event")}
      <p style="margin:18px 0 0;font-size:12px;color:rgba(245,241,234,0.4);">Already have an account? Just sign in &mdash; it is linked automatically.</p>
    `)
  );

  try {
    await resend.emails.send({ from: FROM, to, subject: `You are invited to host ${eventTitle}`, html });
  } catch (e) {
    console.error("Host invite email failed:", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Registration received — pass shows Pending                         */
/* ------------------------------------------------------------------ */

export async function sendRegistrationEmail(opts: {
  to: string;
  guestName: string;
  eventTitle: string;
  tagline: string;
  slug: string;
  passId: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  autoApproved: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return;
  const resend = new Resend(key);

  const passUrl = `${SITE}/e/${opts.slug}/pass/${opts.passId}`;

  const statusLine = opts.autoApproved
    ? "Your pass is confirmed and ready to scan at the entrance."
    : "Your pass is saved below and currently shows as pending. You will receive another email the moment the host approves it.";

  const html = shell(
    card(`
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(245,241,234,0.5);">${opts.tagline || "You are registered"}</p>
      <h1 style="margin:14px 0 0;font-family:Georgia,serif;font-size:28px;color:#f5f1ea;">${opts.eventTitle}</h1>
      ${rule()}
      <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
        Thank you, ${opts.guestName.split(" ")[0]}. ${statusLine}
      </p>
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid rgba(245,241,234,0.08);">
        ${detailRow("Date", [opts.eventDate, opts.eventTime].filter(Boolean).join(" &middot; "))}
        ${detailRow("Venue", opts.venue)}
        ${detailRow("Pass ID", opts.passId)}
      </div>
      ${button(passUrl, "View my pass")}
      <p style="margin:18px 0 0;font-size:12px;color:rgba(245,241,234,0.4);">Keep this email &mdash; the same link always shows your current status.</p>
    `)
  );

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Registration received &mdash; ${opts.eventTitle}`.replace("&mdash;", "—"),
      html,
    });
  } catch (e) {
    console.error("Registration email failed:", e);
  }
}

/* ------------------------------------------------------------------ */
/*  Approved — pass shows Approved, with calendar attachment           */
/* ------------------------------------------------------------------ */

export async function sendApprovalEmail(opts: {
  to: string;
  guestName: string;
  eventTitle: string;
  tagline: string;
  slug: string;
  passId: string;
  eventDate: string;
  eventDateISO: string;
  eventTime: string;
  venue: string;
  address?: string;
  table?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return;
  const resend = new Resend(key);

  const passUrl = `${SITE}/e/${opts.slug}/pass/${opts.passId}`;

  const ics = buildIcs({
    title: opts.eventTitle,
    eventDateISO: opts.eventDateISO,
    eventTime: opts.eventTime,
    venue: opts.venue,
    address: opts.address,
    passUrl,
    uid: opts.passId,
  });

  const seatLine = opts.table && opts.table !== "TBA" ? detailRow("Seating", opts.table) : "";

  const html = shell(
    card(`
      <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c9a227;">You are confirmed</p>
      <h1 style="margin:14px 0 0;font-family:Georgia,serif;font-size:28px;color:#f5f1ea;">${opts.eventTitle}</h1>
      ${rule()}
      <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
        Wonderful news, ${opts.guestName.split(" ")[0]} &mdash; your registration has been approved.
        Your pass is ready. Present it at the entrance and you will be checked straight in.
      </p>
      <div style="margin-top:22px;padding-top:18px;border-top:1px solid rgba(245,241,234,0.08);">
        ${detailRow("Date", [opts.eventDate, opts.eventTime].filter(Boolean).join(" &middot; "))}
        ${detailRow("Venue", opts.venue)}
        ${seatLine}
        ${detailRow("Pass ID", opts.passId)}
      </div>
      ${button(passUrl, "Open my pass")}
      <p style="margin:18px 0 0;font-size:12px;color:rgba(245,241,234,0.4);">
        ${ics ? "The attached calendar file will add this to your phone so you are reminded closer to the day." : "Save this email so your pass is easy to find on the day."}
      </p>
    `)
  );

  const attachments = ics
    ? [{ filename: `${opts.slug}.ics`, content: Buffer.from(ics).toString("base64") }]
    : undefined;

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `You are confirmed — ${opts.eventTitle}`,
      html,
      attachments,
    });
  } catch (e) {
    console.error("Approval email failed:", e);
  }
}
