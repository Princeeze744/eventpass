import { Resend } from "resend";

const FROM = "Story Box <hello@storyboxnigeria.com>";

export async function sendHostInviteEmail(to: string, eventTitle: string, plannerName: string, slug: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const html = `
  <div style="margin:0;padding:0;background:#080807;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
      <div style="text-align:center;padding-bottom:8px;">
        <span style="display:inline-block;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#c9a227;">Story Box</span>
      </div>
      <div style="background:linear-gradient(180deg,#141311,#0b0a09);border:1px solid rgba(201,162,39,0.25);border-radius:24px;padding:40px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(245,241,234,0.5);">You have been invited to host</p>
        <h1 style="margin:14px 0 0;font-family:Georgia,serif;font-size:28px;color:#f5f1ea;">${eventTitle}</h1>
        <div style="width:60px;height:1px;background:#c9a227;margin:20px auto;"></div>
        <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
          ${plannerName} has set up your event on Story Box and invited you as the host.
          Sign in (or create your free account) with this email address and your event
          will be waiting on your dashboard &mdash; live guest counts, seating, gifts, everything.
        </p>
        <a href="https://storyboxnigeria.com/signup" style="display:inline-block;margin-top:28px;background:#c9a227;color:#080807;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;padding:14px 34px;border-radius:999px;">Claim my event</a>
        <p style="margin:18px 0 0;font-size:12px;color:rgba(245,241,234,0.4);">Already have an account? Just sign in &mdash; it is linked automatically.</p>
      </div>
      <p style="text-align:center;margin-top:24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(245,241,234,0.3);">A Story Box Experience</p>
    </div>
  </div>`;
  try {
    await resend.emails.send({ from: FROM, to, subject: `You are invited to host ${eventTitle}`, html });
  } catch (e) {
    console.error("Host invite email failed:", e);
  }
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // email not configured; skip silently
  const resend = new Resend(key);

  const roleLine =
    role === "planner" ? "You can now create events, send digital invitations, manage guests and run the gate."
    : role === "host" ? "You can now watch your guest list fill up, approve who attends, and enjoy your day."
    : role === "vendor" ? "You will receive your call times, briefs and venue access for the events you serve."
    : "You can now register for events and receive your verified digital passes.";

  const html = `
  <div style="margin:0;padding:0;background:#080807;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
      <div style="text-align:center;padding-bottom:8px;">
        <span style="display:inline-block;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#c9a227;">Story Box</span>
      </div>
      <div style="background:linear-gradient(180deg,#141311,#0b0a09);border:1px solid rgba(201,162,39,0.25);border-radius:24px;padding:40px 32px;text-align:center;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;color:#f5f1ea;">Welcome, ${name.split(" ")[0]}.</h1>
        <div style="width:60px;height:1px;background:#c9a227;margin:20px auto;"></div>
        <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(245,241,234,0.7);">
          Your Story Box account is ready. ${roleLine}
        </p>
        <a href="https://storybox-fawn.vercel.app/dashboard" style="display:inline-block;margin-top:28px;background:#c9a227;color:#080807;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;padding:14px 34px;border-radius:999px;">Open my dashboard</a>
      </div>
      <p style="text-align:center;margin-top:24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(245,241,234,0.3);">
        Port Harcourt, Nigeria &mdash; A Story Box Experience
      </p>
    </div>
  </div>`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Story Box",
      html,
    });
  } catch (e) {
    console.error("Welcome email failed (signup still succeeded):", e);
  }
}