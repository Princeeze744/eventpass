"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    hostName: "",
    tagline: "A Celebration",
    eventDate: "",
    eventTime: "12:00 PM",
    venue: "",
    address: "",
    capacity: "",
    approvalMode: "manual",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push(`/dashboard/${data.slug}`);
    router.refresh();
  }

  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";
  const inp = "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[720px]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to console
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl">
          Create an <span className="italic text-[#c9a227]">event.</span>
        </motion.h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Your registration link, passes, scanner and dashboard are generated instantly.
        </p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${card} mt-8 p-6 sm:p-8`}>
          <label className={lbl}>Event Title</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Chioma & Obinna" className={inp} />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Host / Client Name</label>
              <input value={form.hostName} onChange={(e) => set("hostName", e.target.value)} placeholder="Chioma Amadi & Obinna Onyechere" className={inp} />
            </div>
            <div>
              <label className={lbl}>Tagline</label>
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="A Celebration of Love" className={inp} />
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Date</label>
              <input value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} placeholder="Sat, Dec 19, 2026" className={inp} />
            </div>
            <div>
              <label className={lbl}>Time</label>
              <input value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} placeholder="12:00 PM" className={inp} />
            </div>
          </div>

          <div className="mt-6">
            <label className={lbl}>Venue</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Aztech Arcum Event Center" className={inp} />
          </div>

          <div className="mt-6">
            <label className={lbl}>Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="77 Ken Saro Wiwa Road, Rumuola, Port Harcourt" className={inp} />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Capacity (optional)</label>
              <input value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="800" inputMode="numeric" className={inp} />
            </div>
            <div>
              <label className={lbl}>Registration Mode</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => set("approvalMode", "manual")} className={`rounded-xl border px-3 py-3 text-[11px] font-[family-name:var(--font-sans)] ${form.approvalMode === "manual" ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>
                  Host approves
                </button>
                <button onClick={() => set("approvalMode", "auto")} className={`rounded-xl border px-3 py-3 text-[11px] font-[family-name:var(--font-sans)] ${form.approvalMode === "auto" ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>
                  Auto approve
                </button>
              </div>
            </div>
          </div>

          {error && <p className="mt-5 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

          <button onClick={submit} disabled={loading} className="mt-8 flex w-full min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Event <ArrowUpRight className="h-4 w-4" /></>}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
