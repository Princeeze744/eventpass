"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, BadgeCheck, Crown, Activity } from "lucide-react";

type Stats = {
  total: number;
  checkedIn: number;
  vipsIn: number;
  recent: { name: string; tier: string; table: string; time?: string }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    load();
    const id = setInterval(load, 2500);
    return () => clearInterval(id);
  }, []);

  const pct = stats ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <main className="relative min-h-[100svh] bg-[#070707] text-white px-5 py-8 sm:px-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[35vh] w-[80vw] max-w-[700px] rounded-full bg-[#d4af37]/8 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
              Live Dashboard
            </p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-[family-name:var(--font-serif)] text-[#e9d69a]">
              Chioma &amp; Obinna
            </h1>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-400 font-[family-name:var(--font-sans)]">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-emerald-400"
            />
            LIVE
          </span>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 font-[family-name:var(--font-sans)]">
          {[
            { icon: Users, label: "Total Guests", value: stats?.total ?? "—" },
            { icon: BadgeCheck, label: "Checked In", value: stats?.checkedIn ?? "—" },
            { icon: Crown, label: "VIPs Arrived", value: stats?.vipsIn ?? "—" },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm"
            >
              <c.icon className="h-5 w-5 text-[#d4af37]" />
              <p className="mt-4 text-4xl font-semibold tabular-nums">{c.value}</p>
              <p className="mt-1 text-sm text-white/50">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-6 font-[family-name:var(--font-sans)]"
        >
          <div className="flex justify-between text-sm text-white/50">
            <span>Arrival Progress</span>
            <span className="text-[#d4af37]">{pct}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#e9d69a] shadow-[0_0_16px_rgba(212,175,55,0.5)]"
            />
          </div>
        </motion.div>

        {/* Live feed */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] p-6"
        >
          <div className="flex items-center gap-2 text-sm text-white/50 font-[family-name:var(--font-sans)]">
            <Activity className="h-4 w-4 text-[#d4af37]" />
            Recent Arrivals
          </div>
          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {stats?.recent.length ? (
                stats.recent.map((g) => (
                  <motion.div
                    key={g.name + g.time}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3 font-[family-name:var(--font-sans)]"
                  >
                    <div>
                      <p className="font-[family-name:var(--font-serif)] text-lg">
                        {g.name}
                      </p>
                      <p className="text-xs text-white/45">
                        {g.tier} • {g.table}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {g.tier === "VIP Guest" && (
                        <Crown className="h-4 w-4 text-[#d4af37]" />
                      )}
                      <span className="text-xs text-white/40 tabular-nums">
                        {g.time}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-white/30 font-[family-name:var(--font-sans)]">
                  Waiting for first arrival…
                </p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
