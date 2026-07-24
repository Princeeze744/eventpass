"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function RsvpPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);

  const [form, setForm] = useState({ name: "", phone: "", partySize: "1" });
  const [customParty, setCustomParty] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/e/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push(`/e/${slug}/pass/${data.passId}`);
  }

  const inp = "mt-2 w-full sb-input px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[45vh] w-[80vw] sb-glow-green" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <Link href={`/e/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Event details
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
          Reserve your <span className="italic text-[#c9a227]">seat.</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-7 sb-surface p-6 backdrop-blur-sm">
          <label className={lbl}>Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Amara Johnson" className={inp} />

          <label className={`mt-5 block ${lbl}`}>Phone (WhatsApp)</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0803 123 4567" inputMode="tel" className={inp} />

          <label className={`mt-5 block ${lbl}`}>How many of you are coming?</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { v: "1", t: "Just me" },
              { v: "2", t: "Me + 1 guest" },
              { v: "3", t: "Me + 2 guests" },
              { v: "4", t: "Me + 3 guests" },
              { v: "5", t: "Me + 4 guests" },
            ].map((n) => (
              <button key={n.v} onClick={() => { setCustomParty(false); setForm({ ...form, partySize: n.v }); }} className={`rounded-xl border py-3 text-[12px] font-[family-name:var(--font-sans)] ${!customParty && form.partySize === n.v ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>
                {n.t}
              </button>
            ))}
            <button onClick={() => { setCustomParty(true); setForm({ ...form, partySize: "6" }); }} className={`rounded-xl border py-3 text-[12px] font-[family-name:var(--font-sans)] ${customParty ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>
              More
            </button>
          </div>
          {customParty && (
            <div className="mt-3">
              <label className={lbl}>Total number attending (including you)</label>
              <input
                type="number"
                min={6}
                max={20}
                value={form.partySize}
                onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                onBlur={(e) => {
                  const v = Math.max(6, Math.min(20, Number(e.target.value) || 6));
                  setForm({ ...form, partySize: String(v) });
                }}
                className={`${inp} [color-scheme:dark]`}
              />
              <p className="mt-2 text-[11px] text-white/35 font-[family-name:var(--font-sans)]">Up to 20 people on one pass. For larger groups, contact the host.</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

          <button onClick={submit} disabled={loading} className="mt-7 flex w-full min-h-[54px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Get My Pass <ArrowUpRight className="h-4 w-4" /></>}
          </button>

          <p className="mt-4 text-center text-[11px] text-white/35 font-[family-name:var(--font-sans)]">
            Already registered? <Link href={`/e/${slug}/mypass`} className="text-[#c9a227]">Find my pass</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}