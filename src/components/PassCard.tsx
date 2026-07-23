"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, MapPin, CalendarDays, Armchair, Clock, CheckCheck, Loader2 } from "lucide-react";

type PassGuest = {
  passId: string;
  name: string;
  tier: string;
  table: string;
  status: string;
  checkedInOnline: boolean;
};

type EventInfo = {
  event: string;
  tagline: string;
  date: string;
  time: string;
  venue: string;
};

export default function PassCard({
  guest,
  eventInfo,
}: {
  guest: PassGuest;
  eventInfo: EventInfo;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const stage = guest.checkedInOnline
    ? "checked"
    : guest.status === "approved"
    ? "approved"
    : "pending";

  const theme = {
    pending: {
      accent: "#9ca3af",
      soft: "#c7cdd6",
      border: "border-white/20",
      glow: "bg-white/5",
      shadow: "shadow-[0_20px_80px_rgba(255,255,255,0.06)]",
      badge: "PENDING APPROVAL",
      badgeIcon: Clock,
      note: "Awaiting the couple's approval — check back soon",
    },
    approved: {
      accent: "#d4af37",
      soft: "#e9d69a",
      border: "border-[#d4af37]/30",
      glow: "bg-[#d4af37]/10",
      shadow: "shadow-[0_20px_80px_rgba(212,175,55,0.18)]",
      badge: "APPROVED",
      badgeIcon: BadgeCheck,
      note: "Present at entrance • Single use",
    },
    checked: {
      accent: "#34d399",
      soft: "#a7f3d0",
      border: "border-emerald-400/40",
      glow: "bg-emerald-400/10",
      shadow: "shadow-[0_20px_80px_rgba(52,211,153,0.2)]",
      badge: "CHECKED IN",
      badgeIcon: CheckCheck,
      note: "Use the Express Lane at the entrance",
    },
  }[stage];

  async function selfCheckIn() {
    setBusy(true);
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passId: guest.passId }),
    });
    router.refresh();
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-[45vh] w-[90vw] max-w-[650px] rounded-full ${theme.glow} blur-[110px]`} />
      </div>

      <motion.p
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-[11px] sm:text-xs tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]"
      >
        {stage === "pending" ? "Registration Received" : "Your Verified Pass"}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={`relative w-full max-w-[380px] overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-b from-[#141210] to-[#0b0a08] ${theme.shadow}`}
      >
        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "220%" }}
          transition={{ duration: 1.6, delay: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
          className="pointer-events-none absolute inset-y-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="text-[10px] tracking-[0.3em] uppercase font-[family-name:var(--font-sans)]" style={{ color: theme.accent }}>
            EventPass
          </span>
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-[family-name:var(--font-sans)]"
            style={{ color: theme.accent, backgroundColor: `${theme.accent}1a` }}
          >
            <theme.badgeIcon className="h-3.5 w-3.5" />
            {theme.badge}
          </span>
        </div>

        <div className="px-6 pt-6 text-center">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
            {eventInfo.tagline}
          </p>
          <h1 className="mt-2 text-4xl font-[family-name:var(--font-serif)] font-medium" style={{ color: theme.soft }}>
            {eventInfo.event}
          </h1>
          <div className="mx-auto mt-4 h-px w-24" style={{ background: `linear-gradient(to right, transparent, ${theme.accent}99, transparent)` }} />
          <p className="mt-4 text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
            Admitting
          </p>
          <p className="mt-1 text-2xl font-[family-name:var(--font-serif)]">{guest.name}</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 px-6 text-center font-[family-name:var(--font-sans)]">
          {[
            { icon: CalendarDays, label: eventInfo.date, sub: eventInfo.time },
            { icon: MapPin, label: "Venue", sub: eventInfo.venue },
            { icon: Armchair, label: "Seating", sub: guest.table },
          ].map((d, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] px-2 py-3">
              <d.icon className="mx-auto h-4 w-4" style={{ color: theme.accent }} />
              <p className="mt-1.5 text-[10px] text-white/50">{d.label}</p>
              <p className="text-[11px] text-white/85 leading-tight">{d.sub}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 flex items-center">
          <div className="absolute -left-3 h-6 w-6 rounded-full bg-[#070707]" />
          <div className="mx-6 h-px flex-1 border-t border-dashed border-white/15" />
          <div className="absolute -right-3 h-6 w-6 rounded-full bg-[#070707]" />
        </div>

        <div className="flex flex-col items-center px-6 py-6">
          <div className={`relative rounded-2xl bg-white p-3 ${stage === "pending" ? "opacity-40" : ""}`}>
            <QRCodeSVG value={guest.passId} size={140} level="H" />
            {stage === "pending" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-black/80 px-3 py-1 text-[10px] tracking-widest text-white font-[family-name:var(--font-sans)]">
                  PENDING
                </span>
              </div>
            )}
          </div>
          <p className="mt-3 text-[10px] tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">
            {guest.passId}
          </p>
          <p className="mt-1 text-[10px] text-white/30 font-[family-name:var(--font-sans)]">
            {theme.note}
          </p>
        </div>
      </motion.div>

      {stage === "approved" && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={selfCheckIn}
          disabled={busy}
          className="mt-6 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 font-semibold text-black font-[family-name:var(--font-sans)] shadow-[0_0_30px_rgba(52,211,153,0.3)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>I&apos;m On My Way — Check In</>}
        </motion.button>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-6 text-[10px] tracking-[0.3em] uppercase text-white/25 font-[family-name:var(--font-sans)]"
      >
        Powered by EventPass
      </motion.p>
    </main>
  );
}
