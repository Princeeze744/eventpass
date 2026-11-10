import type { Metadata } from "next";
import { prisma } from "@/lib/db";

/* ------------------------------------------------------------------
   What a guest sees before they open anything.

   When an invitation link is pasted into WhatsApp, WhatsApp fetches
   the page and shows whatever picture it finds. Every page under /e
   was inheriting the site-wide metadata from the root layout, so the
   picture it found was the Story Box logo - our advert, sitting on
   top of somebody's wedding invitation. Hosts were deleting the
   preview before sending rather than let it show.

   This layout gives every page of an event its own preview: the
   host's picture, their title, their date and venue. It covers the
   event page and the RSVP link together, because metadata flows down
   to every route beneath it.

   The picture, in order of preference:
     1. inviteImage - chosen for exactly this purpose
     2. coverImage  - so events built before this existed still look
                      like themselves with nothing to do
     3. a generated preview - the event's own name, date and colour.

   There is no fourth option. Our logo is never the answer.
------------------------------------------------------------------ */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const e = await prisma.event.findUnique({
    where: { slug },
    select: {
      title: true,
      tagline: true,
      eventDate: true,
      eventTime: true,
      venue: true,
      inviteImage: true,
      coverImage: true,
      deletedAt: true,
    },
  });

  /* nothing to describe - let the root metadata stand */
  if (!e || e.deletedAt) return {};

  const image = e.inviteImage || e.coverImage || `/e/${slug}/preview`;

  /* The line of text under the picture. WhatsApp gives it about two
     lines before it trims, and it is the only sentence a guest reads
     before deciding whether to open anything - so it opens the way an
     invitation opens, not the way a listing does. */
  const when = [e.eventDate, e.eventTime].filter(Boolean).join(" at ");
  const parts = ["You are invited"];
  if (when) parts.push(when);
  if (e.venue) parts.push(e.venue);
  const description = `${parts.join(" · ")}. Tap to confirm your attendance.`;

  /* openGraph is replaced wholesale rather than merged, which is what
     we want: the root's siteName and images do not survive, so no
     trace of our branding reaches the preview. */
  return {
    title: e.title,
    description,
    openGraph: {
      title: e.title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: e.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: e.title,
      description,
      images: [image],
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  /* purely a carrier for the metadata above - it must add no markup,
     because each page below already renders its own full-height main */
  return <>{children}</>;
}
