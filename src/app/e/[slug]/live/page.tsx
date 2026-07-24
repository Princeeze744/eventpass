"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, DoorOpen, Crown, Zap, Activity } from "lucide-react";

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

  const load = useCallback(async () => {
    const res = await fetch("/api/e/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) setS(await res.json());
  }, [slug]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pct = s && s.expectedHeads > 0 ? Math.min(100, Math.round((s.arrivedHeads / s.expectedHeads) * 100)) : 0;
  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";
  const peak = s?.hourly.length ? Math.max(...s.hourly.map((h) => h.count)) : 1;

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[45vw] rounded-full bg-[#c9a227]/[0.07] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a227] font-[family-name:var(--font-sans)]">Live Arrivals</p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-5xl sm:text-6xl">{s?.event.title || "—"}</h1>
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
                <motion.p key={pct} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-[family-name:var(--font-serif)] text-6xl">{pct}%</motion.p>
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
              <motion.p key={t.k} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-5 font-[family-name:var(--font-serif)] text-4xl">{t.k}</motion.p>
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