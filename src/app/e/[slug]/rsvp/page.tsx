"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function RsvpPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);

  const [form, setForm] = useState({ name: "", phone: "", email: "", partySize: "1" });
  const [error, setError] = useState("");

  const [days, setDays] = useState<{ id: string; label: string; dateText: string; time: string }[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/e/rsvp?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.days) && d.days.length > 1) {
          setDays(d.days);
          setPicked(d.days.map((x: { id: string }) => x.id));
        }
      })
      .catch(() => {});
  }, [slug]);

  function toggleDay(id: string) {
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  }
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/e/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...form, dayIds: picked }),
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

          <label className={`mt-5 block ${lbl}`}>Email (required)</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="amara@email.com" inputMode="email" type="email" className={inp} />
          <p className="mt-2 text-[11px] leading-relaxed text-white/30 font-[family-name:var(--font-sans)]">We send your pass here, and let you know the moment it is approved.</p>

          {days.length > 1 && (
            <div className="mt-6">
              <label className={lbl}>Which days will you attend?</label>
              <div className="mt-3 space-y-2">
                {days.map((d) => (
                  <button key={d.id} onClick={() => toggleDay(d.id)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-[family-name:var(--font-sans)] ${picked.includes(d.id) ? "border-[#c9a227]/60 bg-[#c9a227]/[0.08]" : "border-white/10 bg-black/25"}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${picked.includes(d.id) ? "border-[#c9a227] bg-[#c9a227] text-[#080807]" : "border-white/25"}`}>
                      {picked.includes(d.id) ? "\u2713" : ""}
                    </span>
                    <span>
                      <span className="block text-[13px] text-[#f5f1ea]">{d.label}</span>
                      <span className="block text-[11px] text-white/40">{d.dateText}{d.time ? ` \u00B7 ${d.time}` : ""}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">Untick any day you will not be attending.</p>
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
