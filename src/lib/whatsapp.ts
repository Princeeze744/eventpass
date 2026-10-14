/**
 * WhatsApp Cloud API client.
 *
 * Env vars (set in Vercel, never in the repo):
 *   WHATSAPP_TOKEN        - permanent system-user token
 *   WHATSAPP_PHONE_ID     - the Phone Number ID (NOT the phone number itself)
 *   WHATSAPP_API_VERSION  - optional, e.g. "v23.0". Defaults below.
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";

export function whatsappConfigured(): boolean {
  return Boolean(TOKEN && PHONE_ID);
}

/* ------------------------------------------------------------------
   Nigerian phone normalisation.

   The client's CSV will contain every shape a human can type:
     08030000000 / 0803 000 0000 / +2348030000000 / 2348030000000
     234-803-000-0000 / 8030000000 / '08030000000 (Excel quote)
   WhatsApp wants digits only, full international, no plus:
     2348030000000
------------------------------------------------------------------ */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // keep digits only - kills +, spaces, dashes, brackets, Excel quotes
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;

  // 00234... international prefix
  if (d.startsWith("00")) d = d.slice(2);

  // already 234XXXXXXXXXX (13 digits)
  if (d.startsWith("234") && d.length === 13) return d;

  // 234 followed by a leading zero: 2340803... -> strip the 0
  if (d.startsWith("2340") && d.length === 14) return "234" + d.slice(4);

  // local 0XXXXXXXXXX (11 digits) -> 234XXXXXXXXXX
  if (d.startsWith("0") && d.length === 11) return "234" + d.slice(1);

  // bare 10 digits starting 7/8/9 (leading zero lost by Excel)
  if (d.length === 10 && /^[789]/.test(d)) return "234" + d;

  // anything else we refuse rather than guess - a wrong number is a
  // message delivered to a stranger, and we pay for it
  return null;
}

export type SendResult =
  | { ok: true; messageId: string; to: string }
  | { ok: false; to: string; error: string; code?: number; retryable: boolean };

/* Meta error codes worth treating as "stop the whole run", not "skip one guest" */
const FATAL_CODES = new Set([
  131042, // payment issue on the account
  190, // token expired / invalid
  10, // permission denied
  200, // permission denied
]);

/* Codes where the guest is simply unreachable - skip and carry on */
const SKIP_CODES = new Set([
  131026, // recipient not a WhatsApp user / cannot receive
  131047, // re-engagement required
  131051, // unsupported message type
]);

export class FatalWhatsAppError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "FatalWhatsAppError";
    this.code = code;
  }
}

/**
 * Send one template message with an image header.
 *
 * @param to        raw phone from the guest row - normalised internally
 * @param template  approved template name, e.g. "event_invite"
 * @param lang      template language code, e.g. "en" or "en_US"
 * @param imageUrl  public https URL of the guest's card
 * @param bodyParams ordered {{1}}, {{2}}... values for the template body
 */
export async function sendTemplate(opts: {
  to: string;
  template: string;
  lang: string;
  imageUrl?: string;
  bodyParams?: string[];
  buttonUrlParam?: string;
}): Promise<SendResult> {
  const to = normalizePhone(opts.to) || "";
  if (!to) {
    return {
      ok: false,
      to: String(opts.to || ""),
      error: "Invalid phone number",
      retryable: false,
    };
  }

  if (!whatsappConfigured()) {
    throw new FatalWhatsAppError(
      "WhatsApp is not configured - WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing"
    );
  }

  const components: Record<string, unknown>[] = [];

  if (opts.imageUrl) {
    components.push({
      type: "header",
      parameters: [{ type: "image", image: { link: opts.imageUrl } }],
    });
  }

  if (opts.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: opts.bodyParams.map((t) => ({
        type: "text",
        text: String(t ?? "").slice(0, 900),
      })),
    });
  }

  if (opts.buttonUrlParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: opts.buttonUrlParam }],
    });
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: opts.template,
      language: { code: opts.lang },
      ...(components.length ? { components } : {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
  } catch {
    // network blip - worth retrying this one guest
    return { ok: false, to, error: "Network error reaching WhatsApp", retryable: true };
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* ignore - handled below */
  }

  if (res.ok && json?.messages?.[0]?.id) {
    return { ok: true, messageId: json.messages[0].id, to };
  }

  const err = json?.error || {};
  const code: number | undefined = err.code;
  const detail: string =
    err.error_user_msg || err.error_data?.details || err.message || `HTTP ${res.status}`;

  // account-level problems: stop the whole batch rather than burn 248 failures
  if (code && FATAL_CODES.has(code)) {
    throw new FatalWhatsAppError(detail, code);
  }
  if (res.status === 401 || res.status === 403) {
    throw new FatalWhatsAppError(detail, code);
  }

  // rate limited - caller should back off and retry
  const retryable =
    res.status === 429 ||
    res.status >= 500 ||
    code === 131056 || // pair rate limit
    code === 80007; // throughput limit

  return {
    ok: false,
    to,
    error: detail,
    code,
    retryable: code ? !SKIP_CODES.has(code) && retryable : retryable,
  };
}

/** Small helper so callers can pace themselves politely. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
