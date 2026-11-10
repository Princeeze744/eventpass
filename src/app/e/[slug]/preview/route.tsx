import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   The preview for an event that has no picture of its own.

   Rather than fall back to our logo - which is the whole problem this
   set out to fix - we draw the event itself: its name, its date, its
   venue, in its own colour. A host who uploads nothing still sends an
   invitation that looks like theirs.

   Drawn with Satori, which supports a deliberately small slice of
   CSS: flexbox only, and every container needs an explicit display.
------------------------------------------------------------------ */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const e = await prisma.event.findUnique({
    where: { slug },
    select: {
      title: true,
      tagline: true,
      eventDate: true,
      eventTime: true,
      venue: true,
      accentColor: true,
      deletedAt: true,
    },
  });

  const ac = (e && !e.deletedAt && e.accentColor) || "#c9a227";
  const title = (e && !e.deletedAt && e.title) || "You are invited";
  const tagline = (e && !e.deletedAt && e.tagline) || "";
  const when = e && !e.deletedAt ? [e.eventDate, e.eventTime].filter(Boolean).join("  ·  ") : "";
  const venue = (e && !e.deletedAt && e.venue) || "";

  /* a long title needs to come down a size or it runs off the card */
  const titleSize = title.length > 40 ? 58 : title.length > 26 ? 74 : 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "70px 80px",
          backgroundColor: "#080807",
          backgroundImage: `linear-gradient(135deg, ${ac}26 0%, #080807 42%, #080807 100%)`,
        }}
      >
        {tagline ? (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 9,
              textTransform: "uppercase",
              color: ac,
              textAlign: "center",
            }}
          >
            {tagline}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: titleSize,
            lineHeight: 1.05,
            color: "#f5f1ea",
            textAlign: "center",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            width: 190,
            height: 2,
            backgroundColor: ac,
          }}
        />

        {when ? (
          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontSize: 27,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "rgba(245,241,234,0.78)",
              textAlign: "center",
            }}
          >
            {when}
          </div>
        ) : null}

        {venue ? (
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 23,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(245,241,234,0.45)",
              textAlign: "center",
            }}
          >
            {venue}
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
