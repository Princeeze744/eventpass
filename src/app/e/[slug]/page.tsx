import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Countdown from "@/components/Countdown";
import { Reveal, ParallaxCover, Gallery, StickyNav } from "@/components/SiteMotion";
import { ArrowUpRight, CalendarDays, MapPin, Shirt, Palette, Hotel, UtensilsCrossed, Sparkles, Video, Gift, ScrollText, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

const card = "sb-surface sb-lift";

function Lines({ text }: { text: string }) {
  return (
    <div className="mt-3 space-y-1.5">
      {text.split(/\r?\n/).filter(Boolean).map((l, i) => (
        <p key={i} className="text-[13px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]">{l}</p>
      ))}
    </div>
  );
}

function List({ text, ac }: { text: string; ac: string }) {
  return (
    <div className="mt-4 space-y-2.5">
      {text.split(/\r?\n/).filter(Boolean).map((l, i) => {
        let url = "";
        let label = "";
        if (l.includes("|")) {
          const [nm, ...rest] = l.split("|");
          label = nm.trim();
          url = rest.join("|").trim();
          if (!url) {
            return <p key={i} className="break-words text-[13px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]" style={{ overflowWrap: "anywhere" }}>{label}</p>;
          }
        } else {
          const m = l.match(/https?:\/\/\S+/);
          if (!m) {
            return <p key={i} className="break-words text-[13px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]" style={{ overflowWrap: "anywhere" }}>{l}</p>;
          }
          url = m[0];
          label = l.replace(url, "").replace(/[\s:,\u2014-]+$/, "").trim();
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-white/80 font-[family-name:var(--font-sans)]">{label || "View location"}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[9px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)]" style={{ color: ac, background: `${ac}14`, border: `1px solid ${ac}35` }}>
              View map
              <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export const revalidate = 0;

export default async function EventSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await prisma.event.findUnique({ where: { slug } });
  if (!e || e.deletedAt) notFound();

  const ac = e.accentColor || "#c9a227";

  const heroInner = (
    <div className="relative mx-auto max-w-[900px] px-6 text-center">
      {e.logoUrl && (
        <img src={e.logoUrl} alt="" className="mx-auto mb-6 h-20 w-20 rounded-2xl border border-white/15 object-cover shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
      )}
      <p className="text-[10px] uppercase tracking-[0.45em] font-[family-name:var(--font-sans)]" style={{ color: ac }}>{e.tagline}</p>
      <h1 className="mt-5 font-[family-name:var(--font-serif)] text-[13vw] leading-[0.95] text-[#f5f1ea] sm:text-[80px] sb-display">{e.title}</h1>
      <div className="mx-auto mt-6 h-px w-28" style={{ background: `linear-gradient(90deg,transparent,${ac}b0,transparent)` }} />
      <p className="mt-6 text-[13px] uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-sans)]">{e.eventDate} &middot; {e.eventTime}</p>
      <p className="mt-2 text-[12px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">{e.venue}{e.address ? ` \u00B7 ${e.address}` : ""}</p>
      {e.hashtag && <p className="mt-3 text-[12px] uppercase tracking-[0.3em] font-[family-name:var(--font-sans)]" style={{ color: ac }}>{e.hashtag}</p>}
      <Countdown date={e.eventDateISO || e.eventDate} />
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link href={`/e/${slug}/rsvp`} className="sb-btn px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Register &amp; Get Pass</Link>
        <Link href={`/e/${slug}/mypass`} className="sb-ghost px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-white/75 font-[family-name:var(--font-sans)]">My Pass</Link>
      </div>
    </div>
  );

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#080807] text-[#f5f1ea]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[50vh] w-[90vw] rounded-full blur-[130px]" style={{ background: `${ac}14` }} />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[50vw] sb-glow-warm" />
      </div>

      <StickyNav title={e.title} slug={e.slug} />
      {/* logo also anchors the sticky bar visually */}

      {e.coverImage ? (
        <ParallaxCover src={e.coverImage}>{heroInner}</ParallaxCover>
      ) : (
        <section className="relative mx-auto max-w-[900px] px-5 pb-10 pt-20 text-center sm:px-8">{heroInner}</section>
      )}

      <div className="relative mx-auto max-w-[1000px] px-5 pb-20 sm:px-8">
        {e.story && (
          <Reveal>
            <div className={`${card} mt-4 p-8 text-center`}>
              <ScrollText className="mx-auto h-5 w-5" style={{ color: ac }} strokeWidth={1.6} />
              <h2 className="mt-4 font-[family-name:var(--font-serif)] text-4xl sb-display">Our <span className="italic" style={{ color: ac }}>story</span></h2>
              <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-[14px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.story}</p>
            </div>
          </Reveal>
        )}

        {(e.dressCode || e.colours) && (
          <Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {e.dressCode && (
                <div className={`${card} p-6`}>
                  <Shirt className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Dress Code</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.dressCode}</p>
                </div>
              )}
              {e.colours && (
                <div className={`${card} p-6`}>
                  <Palette className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Colours</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.colours}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {(e.ceremonyMap || e.receptionMap) && (
          <Reveal>
            <div className={`${card} mt-4 p-6`}>
              <MapPin className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Directions</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {e.ceremonyMap && <a href={e.ceremonyMap} target="_blank" rel="noreferrer" className="sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Ceremony map</a>}
                {e.receptionMap && <a href={e.receptionMap} target="_blank" rel="noreferrer" className="sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Reception map</a>}
              </div>
            </div>
          </Reveal>
        )}

        {e.livestream && (
          <Reveal>
            <div className={`${card} mt-4 p-6 text-center`}>
              <Video className="mx-auto h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Watch Live</h3>
              <a href={e.livestream} target="_blank" rel="noreferrer" className="mt-4 inline-flex sb-btn px-7 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Open livestream</a>
            </div>
          </Reveal>
        )}

        {(e.hotels || e.restaurants || e.funSpots) && (
          <Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {e.hotels && (
                <div className={`${card} p-6`}>
                  <Hotel className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Hotels</h3>
                  <List text={e.hotels} ac={ac} />
                </div>
              )}
              {e.restaurants && (
                <div className={`${card} p-6`}>
                  <UtensilsCrossed className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Restaurants</h3>
                  <List text={e.restaurants} ac={ac} />
                </div>
              )}
              {e.funSpots && (
                <div className={`${card} p-6`}>
                  <Sparkles className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Fun Spots</h3>
                  <List text={e.funSpots} ac={ac} />
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
                  <CalendarDays className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Programme</h3>
                  <List text={e.programNote} ac={ac} />
                </div>
              )}
              {e.menuNote && (
                <div className={`${card} p-6`}>
                  <UtensilsCrossed className="h-4 w-4" style={{ color: ac }} strokeWidth={1.6} />
                  <h3 className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Menu</h3>
                  <List text={e.menuNote} ac={ac} />
                </div>
              )}
            </div>
          </Reveal>
        )}

        {e.gallery && (
          <Reveal>
            <div className={`${card} mt-4 p-8`}>
              <Camera className="mx-auto h-5 w-5" style={{ color: ac }} strokeWidth={1.6} />
              <h3 className="mt-4 text-center font-[family-name:var(--font-serif)] text-4xl sb-display">The <span className="italic" style={{ color: ac }}>gallery</span></h3>
              {e.hashtag && <p className="mt-3 text-center text-[12px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{e.hashtag}</p>}
              <Gallery urls={e.gallery.split(/\r?\n/).map((u) => u.trim()).filter(Boolean)} />
            </div>
          </Reveal>
        )}

        {(e.giftNote || e.bankDetails) && (
          <Reveal>
            <div className={`${card} mt-4 p-8 text-center`}>
              <Gift className="mx-auto h-5 w-5" style={{ color: ac }} strokeWidth={1.6} />
              <h3 className="mt-4 font-[family-name:var(--font-serif)] text-3xl sb-figure">Gifting</h3>
              {e.giftNote && <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-[13px] leading-relaxed text-white/55 font-[family-name:var(--font-sans)]">{e.giftNote}</p>}
              {e.bankDetails && (
                <div className="mx-auto mt-5 max-w-md rounded-2xl px-6 py-4" style={{ border: `1px solid ${ac}40`, background: `${ac}0f` }}>
                  <p className="whitespace-pre-line font-mono text-[13px]" style={{ color: ac }}>{e.bankDetails}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        <Reveal>
          <div className="mt-4 overflow-hidden rounded-[28px] sb-cream px-7 py-14 text-center text-[#080807] sm:px-10">
            <h3 className="font-[family-name:var(--font-serif)] text-4xl sb-display sm:text-5xl">We would love to <span className="italic text-[#1c4634]">see you there.</span></h3>
            <Link href={`/e/${e.slug}/rsvp`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#080807] px-9 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#f5f1ea] font-[family-name:var(--font-sans)]">Register &amp; Get Pass <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>

        <p className="mt-12 text-center text-[9px] uppercase tracking-[0.35em] text-white/20 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
      </div>
    </main>
  );
}
