"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Check, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

export default function EventSettings() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);

  const [form, setForm] = useState<Record<string, string>>({});

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
  const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT Abuja"];

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/events/get?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.event) {
          setMsg(d.error === "Unauthorized" ? "Sign in as the event owner to edit settings." : "Could not load this event.");
          setLoading(false);
          return;
        }
        setForm({
          title: d.event.title || "",
          eventType: d.event.eventType || "Wedding",
          hostName: d.event.hostName || "",
          tagline: d.event.tagline || "",
          eventDate: d.event.eventDate || "",
          dateISO: d.event.eventDateISO || "",
          timeISO: "",
          eventTime: d.event.eventTime || "",
          venue: d.event.venue || "",
          state: d.event.state || "",
          address: d.event.address || "",
          capacity: d.event.capacity ? String(d.event.capacity) : "",
          approvalMode: d.event.approvalMode || "manual",
        });
        setLoading(false);
      })
      .catch(() => { setMsg("Network error."); setLoading(false); });
  }, [slug]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/events/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action, ...form, ...extra }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Something went wrong."); return; }
    if (action === "trash" || data.destroyed) { router.push("/dashboard"); router.refresh(); return; }
    if (data.newSlug) { router.push(`/dashboard/${data.newSlug}/settings`); router.refresh(); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (action === "rotateKeys") setMsg("New keys generated. Share them with your team.");
  }

  const card = "sb-surface sb-lift";
  const inp = "mt-2 w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[760px]">
        <TopBar back={`/dashboard/${slug}`} backLabel="Event" />
        <Link href={`/dashboard/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Event console
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
          Event <span className="italic text-[#c9a227]">settings.</span>
        </motion.h1>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c9a227]" /></div>
        ) : (
          <>
            {msg && <p className="mt-5 text-[13px] text-[#c9a227] font-[family-name:var(--font-sans)]">{msg}</p>}

            <div className={`${card} mt-7 p-6`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">Details</p>

              <div className="mt-5">
                <label className={lbl}>Event Type</label>
                <select
                  value={form.eventType || "Wedding"}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className={`${inp} [color-scheme:dark] cursor-pointer`}
                >
                  {["Wedding","Traditional Wedding","Birthday","Conference","Corporate Event","Brand Launch","Concert","Church Program","Gala / Awards","Private Dinner","Funeral / Memorial","Other"].map((t) => (
                    <option key={t} value={t} className="bg-[#0d0c0b]">{t}</option>
                  ))}
                </select>
              </div>

              {[
                { k: "title", l: "Event Title" },
                { k: "hostName", l: "Host / Client Name" },
                { k: "tagline", l: "Occasion Line (subtitle under the title, e.g. A Celebration of Love)" },

                { k: "venue", l: "Venue" },
                { k: "address", l: "Address" },
                { k: "capacity", l: "Capacity" },
              ].map((f) => (
                <div key={f.k} className="mt-5">
                  <label className={lbl}>{f.l}</label>
                  <input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className={inp} />
                </div>
              ))}

              <div className="mt-5">
                <label className={lbl}>State</label>
                <select
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={`${inp} [color-scheme:dark] cursor-pointer`}
                >
                  <option value="" className="bg-[#0d0c0b]">Select a state...</option>
                  {NG_STATES.map((s) => (
                    <option key={s} value={s} className="bg-[#0d0c0b]">{s}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label className={lbl}>Date</label>
                <input
                  type="date"
                  value={form.dateISO || ""}
                  onChange={(e) => setForm({ ...form, dateISO: e.target.value, eventDate: prettyDate(e.target.value) })}
                  className={`${inp} [color-scheme:dark]`}
                />
                <p className="mt-2 text-[11px] text-[#c9a227] font-[family-name:var(--font-sans)]">{form.eventDate || "No date set"}</p>
              </div>

              <div className="mt-5">
                <label className={lbl}>Time</label>
                <input
                  type="time"
                  value={form.timeISO || ""}
                  onChange={(e) => setForm({ ...form, timeISO: e.target.value, eventTime: prettyTime(e.target.value) })}
                  className={`${inp} [color-scheme:dark]`}
                />
                <p className="mt-2 text-[11px] text-[#c9a227] font-[family-name:var(--font-sans)]">{form.eventTime || "No time set"}</p>
              </div>

              <div className="mt-5">
                <label className={lbl}>Registration Mode</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({ ...form, approvalMode: "manual" })} className={`rounded-xl border px-3 py-3 text-[11px] font-[family-name:var(--font-sans)] ${form.approvalMode === "manual" ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>Host approves</button>
                  <button onClick={() => setForm({ ...form, approvalMode: "auto" })} className={`rounded-xl border px-3 py-3 text-[11px] font-[family-name:var(--font-sans)] ${form.approvalMode === "auto" ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>Auto approve</button>
                </div>
              </div>

              <button onClick={() => act("update")} disabled={busy} className="mt-6 flex w-full min-h-[52px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saved</> : "Save Changes"}
              </button>
            </div>

            <div className={`${card} mt-4 p-6`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">Event link</p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                Guests register at: <span className="font-mono text-[12px] text-[#e9d69a]">/e/{slug}</span>
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-white/40 font-[family-name:var(--font-sans)]">
                The link is created from the original title and does not change when you rename the event —
                so invitations already sent keep working. If you renamed the event and want the link to match,
                update it below. <span className="text-amber-400/80">Warning: the old link stops working immediately,
                so only do this before invitations go out.</span>
              </p>
              <button onClick={() => act("updateSlug")} disabled={busy} className="mt-4 flex items-center gap-2 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                <RefreshCw className="h-3.5 w-3.5 text-[#c9a227]" /> Update link to match title
              </button>
            </div>

            <div className={`${card} mt-4 p-6`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">Security</p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                Generate fresh admin and gate keys. Old keys stop working immediately.
              </p>
              <button onClick={() => act("rotateKeys")} disabled={busy} className="mt-4 flex items-center gap-2 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                <RefreshCw className="h-3.5 w-3.5 text-[#c9a227]" /> Rotate keys
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-red-400 font-[family-name:var(--font-sans)]">Danger zone</p>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                Move to trash: the event disappears from your console but everything is recoverable.
              </p>
              <button onClick={() => act("trash")} disabled={busy} className="mt-3 flex items-center gap-2 rounded-full border border-red-500/40 px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-red-400 font-[family-name:var(--font-sans)]">
                <Trash2 className="h-3.5 w-3.5" /> Move to trash
              </button>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <p className="text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                  Delete permanently: erases the event and every guest record forever. Type the exact title to confirm.
                </p>
                <input value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} placeholder={form.title} className={inp} />
                <button
                  onClick={() => act("destroy", { confirmTitle })}
                  disabled={busy || confirmTitle !== form.title}
                  className="mt-3 flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold text-white font-[family-name:var(--font-sans)] disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
