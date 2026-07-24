"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  function prettyDate(iso: string) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function prettyTime(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h)) return t;
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m || 0).padStart(2, "0")} ${suffix}`;
  }

  const EVENT_TYPES = [
    { v: "Wedding", tagline: "A Celebration of Love" },
    { v: "Traditional Wedding", tagline: "A Union of Families" },
    { v: "Birthday", tagline: "A Celebration" },
    { v: "Conference", tagline: "Ideas Worth Gathering For" },
    { v: "Corporate Event", tagline: "A Company Gathering" },
    { v: "Brand Launch", tagline: "Something New Begins" },
    { v: "Concert", tagline: "A Night of Music" },
    { v: "Church Program", tagline: "A Gathering of Faith" },
    { v: "Gala / Awards", tagline: "An Evening of Excellence" },
    { v: "Private Dinner", tagline: "An Intimate Evening" },
    { v: "Funeral / Memorial", tagline: "In Loving Memory" },
    { v: "Other", tagline: "A Celebration" },
  ];

  const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT Abuja"];

  const [form, setForm] = useState({
    title: "",
    eventType: "Wedding",
    hostName: "",
    tagline: "A Celebration",
    eventDate: "",
    dateISO: "",
    eventTime: "",
    timeISO: "",
    venue: "",
    state: "",
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
    if (!form.state) {
      setError("Please select the state where the event holds.");
      return;
    }
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

  const card = "sb-surface sb-lift";
  const inp = "mt-2 w-full sb-input px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[720px]">
        <TopBar back={"/dashboard"} backLabel="Console" />
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to console
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
          Create an <span className="italic text-[#c9a227]">event.</span>
        </motion.h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Your registration link, passes, scanner and dashboard are generated instantly.
        </p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${card} mt-8 p-6 sm:p-8`}>
          <label className={lbl}>Event Type</label>
          <select
            value={form.eventType}
            onChange={(e) => {
              const t = EVENT_TYPES.find((x) => x.v === e.target.value);
              setForm({ ...form, eventType: e.target.value, tagline: t ? t.tagline : form.tagline });
            }}
            className={`${inp} [color-scheme:dark] cursor-pointer`}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.v} value={t.v} className="bg-[#0d0c0b]">{t.v}</option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">Sets a suggested occasion line, which you can still edit.</p>

          <label className={`mt-6 block ${lbl}`}>Event Title</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Chioma & Obinna" className={inp} />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Host / Client Name</label>
              <input value={form.hostName} onChange={(e) => set("hostName", e.target.value)} placeholder="Chioma Amadi & Obinna Onyechere" className={inp} />
            </div>
            <div>
              <label className={lbl}>Occasion line</label>
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="A Celebration of Love" className={inp} />
              <p className="mt-2 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">Small line shown above the event name on passes and invitations.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Date</label>
              <input
                type="date"
                value={form.dateISO || ""}
                onChange={(e) => setForm({ ...form, dateISO: e.target.value, eventDate: prettyDate(e.target.value) })}
                className={`${inp} [color-scheme:dark]`}
              />
              {form.eventDate && <p className="mt-2 text-[11px] text-[#c9a227] font-[family-name:var(--font-sans)]">{form.eventDate}</p>}
            </div>
            <div>
              <label className={lbl}>Time</label>
              <input
                type="time"
                value={form.timeISO || ""}
                onChange={(e) => setForm({ ...form, timeISO: e.target.value, eventTime: prettyTime(e.target.value) })}
                className={`${inp} [color-scheme:dark]`}
              />
              {form.eventTime && <p className="mt-2 text-[11px] text-[#c9a227] font-[family-name:var(--font-sans)]">{form.eventTime}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className={lbl}>Venue</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Aztech Arcum Event Center" className={inp} />
          </div>

          <div className="mt-6">
            <label className={lbl}>State (required)</label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={`${inp} [color-scheme:dark] cursor-pointer`}
            >
              <option value="" className="bg-[#0d0c0b]">Select a state...</option>
              {NG_STATES.map((s) => (
                <option key={s} value={s} className="bg-[#0d0c0b]">{s}</option>
              ))}
            </select>
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

          <button onClick={submit} disabled={loading} className="mt-8 flex w-full min-h-[54px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Event <ArrowUpRight className="h-4 w-4" /></>}
          </button>
        </motion.div>
      </div>
    </main>
  );
}
