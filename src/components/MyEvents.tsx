"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CalendarDays, MapPin, Ticket, ArrowUpRight, Phone, Clock, Video, Shirt, Truck, Wrench } from "lucide-react";

type Rec = {
  passId: string; status: string; checkedIn: boolean; checkedInOnline: boolean;
  tier: string; table: string; partySize: number;
  company?: string; vendorRole?: string; callTime?: string; vendorNote?: string;
  event: {
    slug: string; title: string; tagline: string; eventDate: string; eventTime: string;
    venue: string; address: string; ceremonyMap: string | null; receptionMap: string | null;
    livestream: string | null; programNote: string | null; dressCode: string | null;
    vendorBrief?: string | null; loadInTime?: string | null;
  };
};

export default function MyEvents({ role }: { role: string }) {
  const [records, setRecords] = useState<Rec[]>([]);
  const [phone, setPhone] = useState("");
  const [hasPhone, setHasPhone] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/me/events");
    if (!res.ok) { setLoading(false); return; }
    const d = await res.json();
    setRecords(d.records || []);
    setHasPhone(Boolean(d.user?.phone));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function link() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/me/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Something went wrong."); return; }
    setMsg(d.found > 0 ? `Found ${d.found} event(s).` : "No events found for that number yet.");
    load();
  }

  const card = "sb-surface sb-lift";
  const isVendor = role === "vendor";

  if (loading) {
    return <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c9a227]" /></div>;
  }

  return (
    <div className="mt-8">
      {!hasPhone && (
        <div className={`${card} p-6`}>
          <Phone className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <h2 className="mt-4 font-[family-name:var(--font-serif)] text-3xl sb-figure">Connect your number</h2>
          <p className="mt-2 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
            Enter the phone number you register with at events. Every event using that number will appear here automatically.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && link()}
              placeholder="0803 123 4567"
              inputMode="tel"
              className="flex-1 sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
            />
            <button onClick={link} disabled={busy} className="min-h-[50px] sb-btn px-7 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
              {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Connect"}
            </button>
          </div>
          {msg && <p className="mt-3 text-[12px] text-[#c9a227] font-[family-name:var(--font-sans)]">{msg}</p>}
        </div>
      )}

      {hasPhone && records.length === 0 && (
        <div className={`${card} p-10 text-center`}>
          <Ticket className="mx-auto h-6 w-6 text-white/25" strokeWidth={1.6} />
          <p className="mt-4 text-[13px] text-white/40 font-[family-name:var(--font-sans)]">
            {isVendor ? "No events assigned yet. When an organiser adds your number to an event, it will appear here automatically." : "Nothing here yet. Open the registration link your host sent you, register with this same phone number, and the event will appear here with your pass."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {records.map((r, i) => {
const stage = isVendor
            ? (r.checkedIn ? "On site" : "Expected")
            : r.checkedIn ? "In" : r.checkedInOnline ? "Express" : r.status === "approved" ? "Approved" : r.status === "declined" ? "Declined" : "Pending";
          const colour = isVendor
            ? (r.checkedIn ? "#5eead4" : "#9ca3af")
            : r.checkedIn || r.checkedInOnline ? "#34d399" : r.status === "approved" ? "#c9a227" : r.status === "declined" ? "#f87171" : "#9ca3af";

          return (
            <motion.div
              key={r.passId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`${card} p-6`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">{r.event.tagline}</p>
                  <h3 className="mt-1 font-[family-name:var(--font-serif)] text-3xl">{r.event.title}</h3>
                </div>
                <span className="rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-sans)]" style={{ color: colour, backgroundColor: `${colour}1f` }}>
                  {stage}
                </span>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
                  <CalendarDays className="h-3.5 w-3.5 text-[#c9a227]" strokeWidth={1.6} />
                  <p className="mt-2 text-[12px] text-white/80 font-[family-name:var(--font-sans)]">{r.event.eventDate}</p>
                  <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">{r.event.eventTime}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
                  <MapPin className="h-3.5 w-3.5 text-[#c9a227]" strokeWidth={1.6} />
                  <p className="mt-2 text-[12px] text-white/80 font-[family-name:var(--font-sans)]">{r.event.venue}</p>
                  <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">{r.event.address}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
                  {isVendor ? <Clock className="h-3.5 w-3.5 text-[#5eead4]" strokeWidth={1.6} /> : <Ticket className="h-3.5 w-3.5 text-[#c9a227]" strokeWidth={1.6} />}
                  <p className="mt-2 text-[12px] text-white/80 font-[family-name:var(--font-sans)]">
                    {isVendor ? (r.callTime || r.event.loadInTime || "Call time TBC") : r.table === "TBA" ? "Seat at entrance" : r.table}
                  </p>
                  <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                    {isVendor ? (r.vendorRole || "Vendor") : r.partySize > 1 ? `Party of ${r.partySize}` : r.tier}
                  </p>
                </div>
              </div>

              {isVendor && (r.vendorNote || r.event.vendorBrief) && (
                <div className="mt-3 rounded-2xl border border-[#5eead4]/20 bg-[#5eead4]/[0.05] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-[#5eead4]" strokeWidth={1.6} />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Your brief</p>
                  </div>
                  {r.vendorNote && <p className="mt-2 text-[12px] leading-relaxed text-white/70 font-[family-name:var(--font-sans)]">{r.vendorNote}</p>}
                  {r.event.vendorBrief && <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">{r.event.vendorBrief}</p>}
                  {r.event.loadInTime && <p className="mt-3 text-[11px] text-[#5eead4] font-[family-name:var(--font-sans)]">Load-in from {r.event.loadInTime}</p>}
                </div>
              )}

              {isVendor && r.event.programNote && (
                <div className="mt-3 rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#c9a227]" strokeWidth={1.6} />
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Schedule</p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]">{r.event.programNote}</p>
                </div>
              )}

              {isVendor && r.company && (
                <p className="mt-3 flex items-center gap-2 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">
                  <Truck className="h-3.5 w-3.5 text-[#5eead4]" strokeWidth={1.6} /> {r.company}
                </p>
              )}

              {!isVendor && r.event.dressCode && (
                <p className="mt-3 flex items-center gap-2 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">
                  <Shirt className="h-3.5 w-3.5 text-[#c9a227]" strokeWidth={1.6} /> {r.event.dressCode}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/e/${r.event.slug}/pass/${r.passId}`} className="flex items-center gap-2 sb-btn px-6 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                  {isVendor ? <Truck className="h-3.5 w-3.5" /> : <Ticket className="h-3.5 w-3.5" />} {isVendor ? "My badge" : "My pass"}
                </Link>
                <Link href={`/e/${r.event.slug}`} className="flex items-center gap-2 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                  Event page <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                {r.event.ceremonyMap && (
                  <a href={r.event.ceremonyMap} target="_blank" rel="noreferrer" className="flex items-center gap-2 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                    <MapPin className="h-3.5 w-3.5" /> Directions
                  </a>
                )}
                {r.event.livestream && (
                  <a href={r.event.livestream} target="_blank" rel="noreferrer" className="flex items-center gap-2 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                    <Video className="h-3.5 w-3.5" /> Livestream
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
