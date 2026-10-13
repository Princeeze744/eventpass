import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const W = 1080;
const H = 1350;

/* ---------- fonts ----------
   Satori cannot read woff2, so we ask Google for truetype with an old
   user-agent. Cached per lambda. If anything fails we return null and the
   card still renders in the built-in face - never a 500. */
type Font = { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" };
let fontCache: Font[] | null | undefined = undefined;

async function loadFonts(): Promise<Font[] | null> {
  if (fontCache !== undefined) return fontCache;
  try {
    const UA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.0 (KHTML, like Gecko)";
    const grab = async (family: string, weight: 400 | 600): Promise<Font | null> => {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
        { headers: { "User-Agent": UA }, cache: "force-cache" }
      ).then((r) => r.text());
      const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
      if (!url) return null;
      const data = await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer());
      const name = family.replace(/\+/g, " ");
      return { name, data, weight, style: "normal" as const };
    };
    const got = (
      await Promise.all([
        grab("Cormorant+Garamond", 600),
        grab("Inter", 400),
        grab("Inter", 600),
      ])
    ).filter(Boolean) as Font[];
    fontCache = got.length ? got : null;
  } catch {
    fontCache = null;
  }
  return fontCache;
}

/* fetch the event logo as a data URL so a broken link cannot kill the card */
async function logoData(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "image/png";
    if (!type.startsWith("image/")) return null;
    const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
    return `data:${type};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; passId: string }> }
) {
  const { slug, passId } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!event) return new Response("Not found", { status: 404 });

  const guest = await prisma.guest.findFirst({
    where: {
      eventId: event.id,
      passId: decodeURIComponent(passId).trim(),
      deletedAt: null,
    },
  });
  if (!guest) return new Response("Not found", { status: 404 });

  const accent = event.accentColor || "#d4af37";
  const ink = "#f5f1ea";

  /* multi-day events: which days is this guest admitted for */
  let validFor = "";
  const dayCount = await prisma.eventDay.count({ where: { eventId: event.id } });
  if (dayCount > 1) {
    const mine = await prisma.guestDay.findMany({
      where: { guestId: guest.id },
      include: { day: true },
    });
    validFor = mine
      .sort((a, b) => a.day.position - b.day.position)
      .map((x) => x.day.label)
      .filter(Boolean)
      .join("  /  ");
  }

  const [qr, fonts, logo] = await Promise.all([
    QRCode.toDataURL(guest.passId, {
      margin: 0,
      width: 520,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0a09", light: "#f5f1ea" },
    }),
    loadFonts(),
    logoData(event.logoUrl),
  ]);

  const serif = fonts?.some((f) => f.name === "Cormorant Garamond")
    ? "Cormorant Garamond"
    : undefined;
  const sans = fonts?.some((f) => f.name === "Inter") ? "Inter" : undefined;

  const tLen = event.title.length;
  const titleSize = tLen > 70 ? 62 : tLen > 44 ? 74 : tLen > 26 ? 82 : tLen > 18 ? 92 : 106;
  const nameSize = guest.name.length > 28 ? 46 : guest.name.length > 20 ? 56 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#0b0a09",
          backgroundImage: `radial-gradient(circle at 50% 20%, ${accent}2b, transparent 60%)`,
          position: "relative",
          paddingTop: 108,
          paddingBottom: 84,
          fontFamily: sans || "sans-serif",
        }}
      >
        {/* double frame */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 52,
            right: 52,
            bottom: 52,
            border: `2px solid ${accent}66`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 68,
            left: 68,
            right: 68,
            bottom: 68,
            border: `1px solid ${accent}2e`,
            display: "flex",
          }}
        />

        {/* ---- upper block ---- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: W - 220,
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              width={96}
              height={96}
              alt=""
              style={{ borderRadius: 48, objectFit: "cover", marginBottom: 26 }}
            />
          ) : null}

          <div
            style={{
              fontSize: 23,
              letterSpacing: 10,
              color: accent,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {event.tagline}
          </div>

          <div
            style={{
              fontFamily: serif || sans || "serif",
              fontWeight: 600,
              fontSize: titleSize,
              color: ink,
              marginTop: 22,
              textAlign: "center",
              lineHeight: 1.08,
              display: "flex",
            }}
          >
            {event.title}
          </div>

          <div
            style={{
              width: 170,
              height: 1,
              background: accent,
              marginTop: 32,
              display: "flex",
            }}
          />

          {/* ---- the guest ---- */}
          <div
            style={{
              fontSize: 18,
              letterSpacing: 8,
              color: `${ink}7a`,
              textTransform: "uppercase",
              marginTop: 44,
              display: "flex",
            }}
          >
            This invitation admits
          </div>
          <div
            style={{
              fontFamily: serif || sans || "serif",
              fontWeight: 600,
              fontSize: nameSize,
              color: accent,
              marginTop: 14,
              textAlign: "center",
              lineHeight: 1.15,
              display: "flex",
            }}
          >
            {guest.name}
          </div>

          {validFor ? (
            <div
              style={{
                fontSize: 20,
                color: `${ink}99`,
                marginTop: 16,
                textAlign: "center",
                display: "flex",
              }}
            >
              {validFor}
            </div>
          ) : null}

          {/* ---- details ---- */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 42,
            }}
          >
            <div
              style={{
                fontSize: 22,
                letterSpacing: 7,
                color: accent,
                textTransform: "uppercase",
                textAlign: "center",
                display: "flex",
              }}
            >
              {event.eventDate}
            </div>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 7,
                color: accent,
                textTransform: "uppercase",
                marginTop: 10,
                display: "flex",
              }}
            >
              {event.eventTime}
            </div>
            <div
              style={{
                fontSize: 27,
                color: `${ink}d6`,
                marginTop: 24,
                textAlign: "center",
                display: "flex",
              }}
            >
              {event.venue}
            </div>
            {event.address ? (
              <div
                style={{
                  fontSize: 19,
                  color: `${ink}70`,
                  marginTop: 9,
                  textAlign: "center",
                  display: "flex",
                }}
              >
                {event.address.length > 64
                  ? event.address.slice(0, 61) + "..."
                  : event.address}
              </div>
            ) : null}
            {event.dressCode ? (
              <div
                style={{
                  fontSize: 17,
                  letterSpacing: 5,
                  color: `${ink}62`,
                  textTransform: "uppercase",
                  marginTop: 20,
                  textAlign: "center",
                  display: "flex",
                }}
              >
                {event.dressCode.length > 40
                  ? event.dressCode.slice(0, 37) + "..."
                  : event.dressCode}
              </div>
            ) : null}
          </div>
        </div>

        {/* ---- QR ---- */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: 15,
              background: "#f5f1ea",
              borderRadius: 20,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={214} height={214} alt="" />
          </div>
          <div
            style={{
              fontSize: 21,
              letterSpacing: 6,
              color: `${ink}8a`,
              marginTop: 16,
              display: "flex",
            }}
          >
            {guest.passId}
          </div>
        </div>

        {/* ---- footer ---- */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 15,
              letterSpacing: 7,
              color: `${ink}4d`,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Present this at the entrance
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts ? { fonts } : {}),
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    }
  );
}
