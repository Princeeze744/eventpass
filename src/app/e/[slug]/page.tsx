import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Countdown from "@/components/Countdown";
import { Reveal, ParallaxCover, Gallery, StickyNav } from "@/components/SiteMotion";
import { ArrowUpRight, CalendarDays, MapPin, Shirt, Palette, Hotel, UtensilsCrossed, Sparkles, Video, Gift, ScrollText, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

function List({ text }: { text: string }) {
  return (
    <div className="mt-3 space-y-1.5">
      {text.split(/\r?\n/).filter(Boolean).map((l, i) => (
        <p key={i} className="text-[13px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]">{l}</p>
      ))}
    </div>
  );
}

export default async function EventSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await prisma.event.findUnique({ where: { slug } });
  if (!e || e.deletedAt) notFound();

  if (e.approval !== "approved") {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a227] font-[family-name:var(--font-sans)]">Story Box</p>
        <h1 className="mt-5 font-[family-name:var(--font-serif)] text-4xl">This event is not live yet</h1>
        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
          The organiser is still finalising arrangements. Please check back shortly or contact them directly.
        </p>
      </main>
    );
  }

  const heroInner = (
    <>
      <p className="text-[10px] uppercase tracking-[0.45em] text-[#c9a227] font-[family-name:var(--font-sans)]">{e.tagline}</p>
      <h1 className="mt-5 font-[family-name:var(--font-serif)] text-[13vw] leading-[0.9] sm:text-[7vw]">{e.title}</h1>
      <div className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-[#c9a227]/70 to-transparent" />
      <p className="mt-6 text-[14px] text-white/70 font-[family-name:var(--font-sans)]">{e.eventDate} · {e.eventTime}</p>
      <p className="text-[13px] text-white/50 font-[family-name:var(--font-sans)]">{e.venue}{e.address ? ` · ${e.address}` : ""}</p>
      <Countdown date={e.eventDate} />
      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        <Link href={`/e/${e.slug}/rsvp`} className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#f5f1ea] px-9 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] sm:w-auto">Register &amp; Get Pass <ArrowUpRight className="h-4 w-4" /></Link>
        <Link href={`/e/${e.slug}/mypass`} className="flex min-h-[54px] w-full items-center justify-center rounded-full border border-white/25 px-9 text-[11px] uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm font-[family-name:var(--font-sans)] sm:w-auto">My Pass</Link>
      </div>
    </>
  );

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea]">
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
        <filter id="gsite"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" /></filter>
        <rect width="100%" height="100%" filter="url(#gsite)" />
      </svg>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[50vh] w-[90vw] rounded-full bg-[#1c4634]/25 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[50vw] rounded-full bg-[#c9a227]/[0.07] blur-[120px]" />
      </div>

      <StickyNav title={e.title} slug={e.slug} />

      {e.coverImage ? (
        <ParallaxCover src={e.coverImage}>{heroInner}</ParallaxCover>
      ) : (
        <section className="relative mx-auto max-w-[900px] px-5 pb-10 pt-20 text-center sm:px-8">{heroInner}</section>
      )}

      <div className="relative mx-auto max-w-[1000px] px-5 pb-20 sm:px-8">
        {e.story && (
          <Reveal>
            <div className={`${card} mt-4 p-8 text-center`}>
              <ScrollText className="mx-auto h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
              <h2 className="mt-4 font-[family-name:var(--font-serif)] text-4xl">Our <span className="italic text-[#c9a227]">story</span></h2>
              <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-[14px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.story}</p>
            </div>
          </Reveal>
        )}

        {(e.dressCode || e.colours) && (
          <Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {e.dressCode && (
                <div className={`${card} p-6`}>
                  <Shirt className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Dress Code</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.dressCode}</p>
                </div>
              )}
              {e.colours && (
                <div className={`${card} p-6`}>
                  <Palette className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Colours</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.colours}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {(e.ceremonyName || e.ceremonyMap || e.receptionMap) && (
          <Reveal>
            <div className={`${card} mt-4 p-6`}>
              <MapPin className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Directions</h3>
              {e.ceremonyName && <p className="mt-3 text-[13px] text-white/55 font-[family-name:var(--font-sans)]">Ceremony: {e.ceremonyName}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {e.ceremonyMap && <a href={e.ceremonyMap} target="_blank" rel="noreferrer" className="rounded-full border border-white/12 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Ceremony map</a>}
                {e.receptionMap && <a href={e.receptionMap} target="_blank" rel="noreferrer" className="rounded-full border border-white/12 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Reception map</a>}
              </div>
            </div>
          </Reveal>
        )}

        {e.livestream && (
          <Reveal>
            <div className={`${card} mt-4 p-6 text-center`}>
              <Video className="mx-auto h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Watch Live</h3>
              <a href={e.livestream} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[#f5f1ea] px-7 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Open livestream</a>
            </div>
          </Reveal>
        )}

        {(e.hotels || e.restaurants || e.funSpots) && (
          <Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {e.hotels && (
                <div className={`${card} p-6`}>
                  <Hotel className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Hotels</h3>
                  <List text={e.hotels} />
                </div>
              )}
              {e.restaurants && (
                <div className={`${card} p-6`}>
                  <UtensilsCrossed className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Restaurants</h3>
                  <List text={e.restaurants} />
                </div>
              )}
              {e.funSpots && (
                <div className={`${card} p-6`}>
                  <Sparkles className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Fun Spots</h3>
                  <List text={e.funSpots} />
                </div>
              )}
            </div>
          </Reveal>
        )}

        {(e.programNote || e.menuNote) && (
          <Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {e.programNote && (
                <div className={`${card} p-6`}>
                  <CalendarDays className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Programme</h3>
                  <List text={e.programNote} />
                </div>
              )}
              {e.menuNote && (
                <div className={`${card} p-6`}>
                  <UtensilsCrossed className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Menu</h3>
                  <List text={e.menuNote} />
                </div>
              )}
            </div>
          </Reveal>
        )}

        {e.gallery && (
          <Reveal>
            <div className={`${card} mt-4 p-8`}>
              <Camera className="mx-auto h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
              <h3 className="mt-4 text-center font-[family-name:var(--font-serif)] text-4xl">The <span className="italic text-[#c9a227]">gallery</span></h3>
              {e.hashtag && <p className="mt-3 text-center text-[12px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{e.hashtag}</p>}
              <Gallery urls={e.gallery.split(/\r?\n/).map((u) => u.trim()).filter(Boolean)} />
            </div>
          </Reveal>
        )}

        {(e.giftNote || e.bankDetails) && (
          <Reveal>
            <div className={`${card} mt-4 p-8 text-center`}>
              <Gift className="mx-auto h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-3xl">Gifting</h3>
              {e.giftNote && <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.giftNote}</p>}
              {e.bankDetails && (
                <div className="mx-auto mt-5 max-w-md rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.06] px-6 py-4">
                  <p className="whitespace-pre-line font-mono text-[13px] text-[#c9a227]">{e.bankDetails}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className="mt-4 overflow-hidden rounded-3xl bg-[#f5f1ea] px-7 py-14 text-center text-[#080807] sm:px-10">
            <h3 className="font-[family-name:var(--font-serif)] text-4xl sm:text-5xl">We would love to <span className="italic text-[#1c4634]">see you there.</span></h3>
            <Link href={`/e/${e.slug}/rsvp`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#080807] px-9 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#f5f1ea] font-[family-name:var(--font-sans)]">Register &amp; Get Pass <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>

        <p className="mt-12 text-center text-[9px] uppercase tracking-[0.35em] text-white/20 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
      </div>
    </main>
  );
}
