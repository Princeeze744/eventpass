"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Heart, Users, Check, X, Crown, Gift, CalendarDays, MapPin, Armchair, Video, Utensils, Clock } from "lucide-react";

type Data = {
  event: Record<string, string | null>;
  stats: Record<string, number>;
  tables: { name: string; section: string; capacity: number; guests: { name: string; partySize: number; tier: string }[] }[];
  recent: { name: string; tier: string; table: string; partySize: number; time: string }[];
};

export default function HostDashboard() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: k }),
    });
    if (!res.ok) return false;
    setData(await res.json());
    return true;
  }, [slug]);

  useEffect(() => {
    if (tried) return;
    setTried(true);
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`sb_admin_${slug}`) : null;
    if (saved) { setKey(saved); load(saved).then((ok) => { if (ok) setUnlocked(true); }); }
  }, [tried, slug, load]);

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => load(key), 8000);
    return () => clearInterval(t);
  }, [unlocked, key, load]);

  useEffect(() => {
    const target = new Date(String(data?.event.eventDate || "")).getTime();
    if (isNaN(target)) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60) });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [data]);

  async function unlock() {
    setBusy(true);
    const ok = await load(key);
    setBusy(false);
    if (ok) { setUnlocked(true); sessionStorage.setItem(`sb_admin_${slug}`, key); }
    else setMsg("Wrong access key.");
  }

  const card = "sb-surface sb-lift";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <div className={`${card} w-full max-w-[360px] p-6`}>
          <Heart className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Your Event</h1>
          <p className="mt-2 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">Enter the access key from your planner.</p>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="ADM-XXXXXX" className="mt-4 w-full sb-input px-4 py-3 uppercase tracking-widest text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]" />
          {msg && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>}
          <button onClick={unlock} disabled={busy} className="mt-4 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  const e = data!.event;
  const s = data!.stats;
  const pct = s.expectedHeads > 0 ? Math.round((s.arrivedHeads / s.expectedHeads) * 100) : 0;

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[50vh] w-[85vw] sb-glow-green" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[45vw] sb-glow-warm" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="text-[10px] sb-eyebrow text-[#c9a227] font-[family-name:var(--font-sans)]">{e.tagline}</p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-6xl sb-display leading-[0.95] sm:text-7xl">{e.title}</h1>
          <p className="mt-4 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">{e.eventDate} · {e.eventTime} · {e.venue}</p>

          {left && (
            <div className="mt-8 flex justify-center gap-3">
              {[{ v: left.d, l: "Days" }, { v: left.h, l: "Hours" }, { v: left.m, l: "Mins" }, { v: left.s, l: "Secs" }].map((u) => (
                <div key={u.l} className={`${card} min-w-[76px] px-4 py-3`}>
                  <p className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">{String(u.v).padStart(2, "0")}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">{u.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { k: s.registered, v: "Registered", Icon: Users },
            { k: s.attending, v: "Attending", Icon: Check },
            { k: s.notAttending, v: "Cannot make it", Icon: X },
            { k: s.expectedHeads, v: "Expected guests", Icon: Crown },
          ].map((t) => (
            <div key={t.v} className={`${card} p-5`}>
              <t.Icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-4 font-[family-name:var(--font-serif)] text-4xl sb-display">{t.k}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">{t.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className={`${card} flex flex-col items-center justify-center p-8 lg:col-span-5`}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Arrivals on the day</p>
            <div className="relative mt-5 h-[180px] w-[180px]">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#c9a227" strokeWidth="7" strokeLinecap="round" strokeDasharray={264} animate={{ strokeDashoffset: 264 - (264 * pct) / 100 }} transition={{ duration: 1 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="font-[family-name:var(--font-serif)] text-5xl sb-display">{pct}%</p>
              </div>
            </div>
            <p className="mt-5 font-[family-name:var(--font-serif)] text-2xl">{s.arrivedHeads} <span className="text-white/30">/ {s.expectedHeads}</span></p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">In the room</p>
          </div>

          <div className={`${card} p-6 lg:col-span-7`}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Just arrived</p>
            <div className="mt-4 space-y-2">
              {data!.recent.length ? data!.recent.map((g, i) => (
                <motion.div key={g.name + g.time} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-black/25 px-5 py-3">
                  <div>
                    <p className="font-[family-name:var(--font-serif)] text-lg">{g.name}</p>
                    <p className="text-[11px] text-white/35 font-[family-name:var(--font-sans)]">{g.tier}{g.partySize > 1 ? ` · party of ${g.partySize}` : ""} · {g.table}</p>
                  </div>
                  <span className="font-mono text-[11px] text-white/30">{g.time}</span>
                </motion.div>
              )) : <p className="py-8 text-center text-[12px] text-white/25 font-[family-name:var(--font-sans)]">No arrivals yet.</p>}
            </div>
          </div>
        </div>

        {data!.tables.length > 0 && (
          <div className={`${card} mt-3 p-6`}>
            <div className="flex items-center gap-2">
              <Armchair className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Seating arrangement</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data!.tables.map((t) => (
                <div key={t.name} className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-[family-name:var(--font-serif)] text-xl">{t.name}</p>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-[family-name:var(--font-sans)]">{t.section}</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {t.guests.map((g) => (
                      <p key={g.name} className="text-[12px] text-white/55 font-[family-name:var(--font-sans)]">{g.name}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""}</p>
                    ))}
                    {t.guests.length === 0 && <p className="text-[11px] text-white/20 font-[family-name:var(--font-sans)]">Not assigned yet</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(e.giftNote || e.bankDetails) && (
            <div className={`${card} p-6`}>
              <Gift className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-4 font-[family-name:var(--font-serif)] text-2xl">Gifting</p>
              {e.giftNote && <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">{e.giftNote}</p>}
              {e.bankDetails && <p className="mt-3 whitespace-pre-line rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/[0.06] px-4 py-3 font-mono text-[12px] text-[#c9a227]">{e.bankDetails}</p>}
            </div>
          )}

          {(e.programNote || e.menuNote) && (
            <div className={`${card} p-6`}>
              <Clock className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-4 font-[family-name:var(--font-serif)] text-2xl">On the day</p>
              {e.programNote && <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">{e.programNote}</p>}
              {e.menuNote && <p className="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-white/40 font-[family-name:var(--font-sans)]">{e.menuNote}</p>}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href={`/e/${slug}`} className="sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Event website</Link>
          <Link href={`/e/${slug}/admin`} className="sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Approve guests</Link>
          <Link href={`/e/${slug}/live`} className="rounded-full border border-[#c9a227]/40 px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Live board</Link>
        </div>

        <p className="mt-10 text-center text-[9px] uppercase tracking-[0.35em] text-white/20 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
      </div>
    </main>
  );
}
