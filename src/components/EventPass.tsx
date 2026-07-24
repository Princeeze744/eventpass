"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Clock, CheckCheck, Loader2, CalendarDays, MapPin, Armchair } from "lucide-react";

type Props = {
  slug: string;
  passId: string;
  name: string;
  tier: string;
  table: string;
  section: string;
  partySize: number;
  status: string;
  checkedInOnline: boolean;
  event: { title: string; tagline: string; eventDate: string; eventTime: string; venue: string };
};

export default function EventPass(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const stage = p.checkedInOnline ? "checked" : p.status === "approved" ? "approved" : "pending";

  const theme = {
    pending: { accent: "#9ca3af", badge: "PENDING APPROVAL", Icon: Clock, note: "Awaiting approval — check back soon" },
    approved: { accent: "#c9a227", badge: "APPROVED", Icon: ShieldCheck, note: "Present at entrance · Single use" },
    checked: { accent: "#34d399", badge: "CHECKED IN", Icon: CheckCheck, note: "Use the express lane at the entrance" },
  }[stage];

  async function selfCheckIn() {
    setBusy(true);
    await fetch("/api/e/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: p.slug, passId: p.passId }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[45vh] w-[80vw] rounded-full blur-[130px]" style={{ background: `${theme.accent}18` }} />
      </div>

      <p className="relative mb-6 text-[10px] uppercase tracking-[0.4em] text-white/35 font-[family-name:var(--font-sans)]">
        {stage === "pending" ? "Registration received" : "Your verified pass"}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 14, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[370px] overflow-hidden rounded-[28px] border p-7"
        style={{ borderColor: `${theme.accent}44`, background: "linear-gradient(180deg,#141311,#0b0a09)", boxShadow: `0 30px 80px -30px ${theme.accent}44` }}
      >
        <motion.div
          initial={{ x: "-130%" }}
          animate={{ x: "230%" }}
          transition={{ duration: 1.8, delay: 1, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.35em] font-[family-name:var(--font-sans)]" style={{ color: theme.accent }}>Story Box</span>
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)]" style={{ color: theme.accent, backgroundColor: `${theme.accent}1f` }}>
            <theme.Icon className="h-3 w-3" /> {theme.badge}
          </span>
        </div>

        <div className="mt-7 text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-[family-name:var(--font-sans)]">{p.event.tagline}</p>
          <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl" style={{ color: theme.accent }}>{p.event.title}</h1>
          <div className="mx-auto mt-4 h-px w-20" style={{ background: `linear-gradient(90deg,transparent,${theme.accent}99,transparent)` }} />
          <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/35 font-[family-name:var(--font-sans)]">Admitting</p>
          <p className="mt-1 font-[family-name:var(--font-serif)] text-2xl">{p.name}</p>
          {p.partySize > 1 && (
            <p className="mt-1 text-[11px] text-white/45 font-[family-name:var(--font-sans)]">Party of {p.partySize}</p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center font-[family-name:var(--font-sans)]">
          {[
            { Icon: CalendarDays, l: p.event.eventDate, s: p.event.eventTime },
            { Icon: MapPin, l: "Venue", s: p.event.venue },
            { Icon: Armchair, l: "Seating", s: p.table === "TBA" ? "At entrance" : p.table },
          ].map((d, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-2 py-3">
              <d.Icon className="mx-auto h-3.5 w-3.5" style={{ color: theme.accent }} strokeWidth={1.6} />
              <p className="mt-1.5 text-[9px] text-white/45">{d.l}</p>
              <p className="text-[10px] leading-tight text-white/85">{d.s}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 flex items-center">
          <div className="absolute -left-10 h-6 w-6 rounded-full bg-[#080807]" />
          <div className="h-px flex-1 border-t border-dashed border-white/15" />
          <div className="absolute -right-10 h-6 w-6 rounded-full bg-[#080807]" />
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className={`rounded-2xl bg-[#f5f1ea] p-3 ${stage === "pending" ? "opacity-40" : ""}`}>
            <QRCodeSVG value={p.passId} size={132} level="H" bgColor="#f5f1ea" fgColor="#080807" />
          </div>
          <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-white/40">{p.passId}</p>
          <p className="mt-1 text-[10px] text-white/30 font-[family-name:var(--font-sans)]">{theme.note}</p>
        </div>
      </motion.div>

      {stage === "approved" && (
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          onClick={selfCheckIn}
          disabled={busy}
          className="relative mt-6 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-9 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Online Check-In"}
        </motion.button>
      )}

      <p className="relative mt-8 text-[9px] uppercase tracking-[0.35em] text-white/25 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
    </main>
  );
}
