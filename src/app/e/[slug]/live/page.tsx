"use client";

import TopBar from "@/components/TopBar";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, DoorOpen, Crown, Zap, Activity, ShieldCheck, Loader2 } from "lucide-react";

type Stats = {
  event: { title: string; tagline: string; eventDate: string; venue: string; capacity: number | null };
  registered: number; pending: number; approved: number; declined: number;
  expectedHeads: number; arrivedHeads: number; arrivedCount: number; express: number;
  hourly: { hour: string; count: number }[];
  recent: { name: string; tier: string; table: string; partySize: number; time: string }[];
};

export default function LiveBoard() {
  const params = useParams();
  const slug = String(params.slug);
  const [s, setS] = useState<Stats | null>(null);
  const [clock, setClock] = useState("");

  /* This board shows guest names as they walk in, so it needs a key
     the way the gate scanner and the seating plan do. Either key
     works: the host has the admin key, the ushers have the gate key,
     and whoever sets up the screen at the venue has one of them. */
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keyError, setKeyError] = useState("");

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      /* sent as both: the server checks each against its own key, so
         one field works whichever kind of key was typed */
      body: JSON.stringify({ slug, adminKey: k, usherKey: k }),
    });
    if (!res.ok) return false;
    setS(await res.json());
    return true;
  }, [slug]);

  /* A screen left running all night must not go dark because of one
     dropped request, so a failed poll keeps the last good numbers on
     screen rather than throwing the board back to the lock. */
  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => { load(key); }, 4000);
    return () => clearInterval(t);
  }, [unlocked, key, load]);

  useEffect(() => {
    if (tried) return;
    setTried(true);
    if (typeof window === "undefined") return;
    /* the host usually reaches this from the console, where the admin
       key is already in hand - so the common case needs no typing */
    const saved =
      sessionStorage.getItem(`sb_live_${slug}`) ||
      sessionStorage.getItem(`sb_admin_${slug}`);
    if (!saved) return;
    setKey(saved);
    load(saved).then((ok) => { if (ok) setUnlocked(true); });
  }, [tried, slug, load]);

  async function unlock() {
    if (!key.trim()) return;
    setBusy(true);
    setKeyError("");
    const ok = await load(key.trim());
    setBusy(false);
    if (!ok) { setKeyError("That key does not open this event."); return; }
    setUnlocked(true);
    sessionStorage.setItem(`sb_live_${slug}`, key.trim());
  }

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pct = s && s.expectedHeads > 0 ? Math.min(100, Math.round((s.arrivedHeads / s.expectedHeads) * 100)) : 0;
  const card = "sb-surface sb-lift";
  const peak = s?.hourly.length ? Math.max(...s.hourly.map((h) => h.count)) : 1;

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <div className={`${card} w-full max-w-[380px] p-6`}>
          <ShieldCheck className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Live Arrivals</p>
          <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Unlock the board</h1>
          <p className="mt-3 text-[12px] leading-relaxed text-white/40 font-[family-name:var(--font-sans)]">
            This board shows your guests&apos; names as they arrive, so it needs a key.
            Either the admin key or the gate key will open it.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="ADM-XXXXXX or GATE-XXXXXX"
            className="mt-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 uppercase tracking-widest text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />
          {keyError && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{keyError}</p>}
          <button onClick={unlock} disabled={busy} className="mt-4 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Open board"}
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-white/25 font-[family-name:var(--font-sans)]">
            You only enter this once per screen. Leave the tab open and it stays unlocked for the night.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[45vw] sb-glow-warm" />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <TopBar back={`/e/${slug}/admin`} backLabel="Guests" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] sb-eyebrow text-[#c9a227] font-[family-name:var(--font-sans)]">Live Arrivals</p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-5xl sb-display sm:text-6xl">{s?.event.title || "—"}</h1>
            <p className="mt-2 text-[12px] text-white/40 font-[family-name:var(--font-sans)]">{s?.event.eventDate} · {s?.event.venue}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl text-white/70">{clock}</span>
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-[family-name:var(--font-sans)]">
              <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="h-2 w-2 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-12">
          {/* Progress ring */}
          <div className={`${card} flex flex-col items-center justify-center p-8 lg:col-span-4 lg:row-span-2`}>
            <div className="relative h-[220px] w-[220px]">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke="#c9a227" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={264}
                  animate={{ strokeDashoffset: 264 - (264 * pct) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 8px rgba(201,162,39,0.5))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.p key={pct} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-[family-name:var(--font-serif)] text-6xl sb-display">{pct}%</motion.p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Arrived</p>
              </div>
            </div>
            <p className="mt-6 font-[family-name:var(--font-serif)] text-3xl">
              {s?.arrivedHeads ?? 0} <span className="text-white/30">/ {s?.expectedHeads ?? 0}</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Guests in the room</p>
          </div>

          {/* Stat tiles */}
          {[
            { k: s?.registered ?? 0, v: "Registered", Icon: Users },
            { k: s?.approved ?? 0, v: "Attending", Icon: Crown },
            { k: s?.declined ?? 0, v: "Not attending", Icon: Users },
            { k: s?.arrivedCount ?? 0, v: "Checked in", Icon: DoorOpen },
            { k: s?.express ?? 0, v: "Express waiting", Icon: Zap },
          ].map((t) => (
            <motion.div key={t.v} layout className={`${card} p-5 lg:col-span-2`}>
              <t.Icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <motion.p key={t.k} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-5 font-[family-name:var(--font-serif)] text-4xl sb-display">{t.k}</motion.p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{t.v}</p>
            </motion.div>
          ))}

          {/* Arrival curve */}
          <div className={`${card} p-6 lg:col-span-8`}>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Arrivals by hour</p>
            </div>
            <div className="mt-6 flex h-[120px] items-end gap-2">
              {(s?.hourly.length ? s.hourly : [{ hour: "—", count: 0 }]).map((h) => (
                <div key={h.hour} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(h.count / peak) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#1c4634] to-[#c9a227]"
                    style={{ minHeight: h.count ? 6 : 2 }}
                  />
                  <span className="text-[9px] text-white/35 font-[family-name:var(--font-sans)]">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live feed */}
        <div className={`${card} mt-3 p-6`}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Just arrived</p>
          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {s?.recent.length ? s.recent.map((g) => (
                <motion.div
                  key={g.name + g.time}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-black/30 px-5 py-3.5"
                >
                  <div>
                    <p className="font-[family-name:var(--font-serif)] text-xl">{g.name}</p>
                    <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                      {g.tier}{g.partySize > 1 ? ` · party of ${g.partySize}` : ""} · {g.table}
                    </p>
                  </div>
                  <span className="font-mono text-[12px] text-white/35">{g.time}</span>
                </motion.div>
              )) : (
                <p className="py-8 text-center text-[12px] text-white/25 font-[family-name:var(--font-sans)]">Waiting for the first guest…</p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] uppercase tracking-[0.35em] text-white/20 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
      </div>
    </main>
  );
}
