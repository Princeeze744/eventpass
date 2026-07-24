"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Loader2, Truck, Plus, X, ArrowLeft, Clock, Check, Trash2, Pencil, MessageCircle } from "lucide-react";

type V = {
  id: string; passId: string; name: string; phone: string | null;
  company: string; vendorRole: string; callTime: string; vendorNote: string;
  checkedIn: boolean; checkedInAt: string | null;
};

const BLANK = { name: "", company: "", vendorRole: "", callTime: "", phone: "", vendorNote: "" };

export default function Vendors() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [loadIn, setLoadIn] = useState("");
  const [vendors, setVendors] = useState<V[]>([]);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState<V | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: k, action: "list" }),
    });
    if (!res.ok) return false;
    const d = await res.json();
    setTitle(d.event.title);
    setBrief(d.event.vendorBrief || "");
    setLoadIn(d.event.loadInTime || "");
    setVendors(d.vendors);
    return true;
  }, [slug]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!showAdd && !editing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showAdd, editing]);

  useEffect(() => {
    if (tried) return;
    setTried(true);
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`sb_admin_${slug}`) : null;
    if (saved) { setKey(saved); load(saved).then((ok) => { if (ok) setUnlocked(true); }); }
  }, [tried, slug, load]);

  async function unlock() {
    setBusy(true);
    const ok = await load(key);
    setBusy(false);
    if (ok) { setUnlocked(true); sessionStorage.setItem(`sb_admin_${slug}`, key); } else setMsg("Wrong admin key.");
  }

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/e/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, ...body }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.error) { setMsg(d.error); return; }
    setForm(BLANK); setEditing(null); setShowAdd(false);
    load(key);
  }

  const inp = "mt-2 w-full sb-input px-4 py-3 text-[#f5f1ea] font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <div className="sb-surface w-full max-w-[360px] p-6">
          <div className="sb-icon sb-icon-gold"><Truck className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} /></div>
          <h1 className="mt-4 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227] sb-display">Vendor Hub</h1>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="ADM-XXXXXX" className={`${inp} uppercase tracking-widest`} />
          {msg && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>}
          <button onClick={unlock} disabled={busy} className="sb-btn sb-sheen mt-4 w-full min-h-[50px] text-[11px] uppercase tracking-[0.2em] font-semibold font-[family-name:var(--font-sans)]">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  const arrived = vendors.filter((v) => v.checkedIn).length;

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href={`/e/${slug}/admin`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Host terminal
            </Link>
            <p className="mt-4 text-[10px] sb-eyebrow text-white/35 font-[family-name:var(--font-sans)]">Vendor Hub</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif)] text-4xl text-[#c9a227] sb-display">{title}</h1>
            <p className="mt-3 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">{vendors.length} vendors · {arrived} arrived</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="sb-btn sb-sheen flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold font-[family-name:var(--font-sans)]">
            <Plus className="h-3.5 w-3.5" /> Add vendor
          </button>
        </div>

        <div className="sb-surface mt-8 p-6">
          <p className={lbl}>Load-in time</p>
          <input value={loadIn} onChange={(e) => setLoadIn(e.target.value)} onBlur={() => act({ action: "brief", vendorBrief: brief, loadInTime: loadIn })} placeholder="8:00 AM" className={inp} />
          <p className={`mt-5 ${lbl}`}>Brief for all vendors</p>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} onBlur={() => act({ action: "brief", vendorBrief: brief, loadInTime: loadIn })} rows={3} placeholder="Parking at rear gate. Power available on stage left. Setup must finish by 11 AM." className={`${inp} resize-y`} />
        </div>

        <div className="mt-4 space-y-3">
          {vendors.length === 0 && (
            <div className="sb-surface p-12 text-center">
              <p className="text-[13px] text-white/35 font-[family-name:var(--font-sans)]">No vendors yet. Add your DJ, caterer, photographer and decorator.</p>
            </div>
          )}

          {vendors.map((v) => (
            <motion.div key={v.id} layout className="sb-surface sb-lift group p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="sb-icon"><Truck className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} /></div>
                  <div>
                    <p className="font-[family-name:var(--font-serif)] text-2xl">{v.name}</p>
                    <p className="mt-0.5 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">
                      {v.vendorRole || "Vendor"}{v.company ? ` · ${v.company}` : ""}
                    </p>
                    {v.phone && <p className="mt-1 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">{v.phone}</p>}
                    {v.vendorNote && <p className="mt-2 text-[12px] leading-relaxed text-white/40 font-[family-name:var(--font-sans)]">{v.vendorNote}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {v.callTime && (
                    <span className="sb-badge sb-badge-gold font-[family-name:var(--font-sans)]">
                      <Clock className="h-3 w-3" /> {v.callTime}
                    </span>
                  )}
                  {v.checkedIn
                    ? <span className="sb-badge sb-badge-green font-[family-name:var(--font-sans)]"><Check className="h-3 w-3" /> Arrived {v.checkedInAt}</span>
                    : <span className="sb-badge text-white/40 font-[family-name:var(--font-sans)]">Not arrived</span>}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/e/${slug}/pass/${v.passId}`} className="sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">View badge</Link>
                {v.phone && (
                  <a href={`https://wa.me/234${v.phone.replace(/^0/, "")}?text=${encodeURIComponent(`Hello ${v.name}, here is your vendor badge for ${title}. Call time: ${v.callTime || "TBC"}.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500/90 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                )}
                <button onClick={() => { setEditing(v); setForm({ name: v.name, company: v.company, vendorRole: v.vendorRole, callTime: v.callTime, phone: v.phone || "", vendorNote: v.vendorNote }); }} className="sb-ghost px-4 py-2.5 text-[10px] text-white/60"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => act({ action: "remove", id: v.id })} className="rounded-full border border-red-500/30 px-4 py-2.5 text-[10px] text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {(showAdd || editing) && mounted && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAdd(false); setEditing(null); setForm(BLANK); }} className="fixed inset-0 z-[100] flex items-end justify-center bg-[#050504]/92 backdrop-blur-xl sm:items-center sm:px-5">
            <motion.div initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.stopPropagation()} className="sb-panel flex max-h-[92svh] w-full max-w-[460px] flex-col overflow-hidden rounded-b-none sm:max-h-[86vh] sm:rounded-[28px]">
              <div className="flex shrink-0 items-start justify-between border-b border-white/[0.07] px-6 pb-5 pt-6">
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227] sb-display">{editing ? "Edit vendor" : "Add vendor"}</h3>
                  <p className="mt-1 text-[12px] text-white/40 font-[family-name:var(--font-sans)]">They receive a badge to scan on arrival.</p>
                </div>
                <button onClick={() => { setShowAdd(false); setEditing(null); setForm(BLANK); }} className="sb-ghost p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">

                {[
                { k: "name", l: "Contact name", p: "Emeka Obi" },
                { k: "company", l: "Company", p: "Golden Sounds DJ" },
                { k: "vendorRole", l: "Role", p: "DJ · Caterer · Photographer" },
                { k: "callTime", l: "Call time", p: "10:00 AM" },
                { k: "phone", l: "Phone", p: "0803 123 4567" },
              ].map((f) => (
                <div key={f.k} className="mt-4">
                  <label className={lbl}>{f.l}</label>
                  <input value={form[f.k as keyof typeof form]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.p} className={inp} />
                </div>
              ))}

              <div className="mt-4">
                  <label className={lbl}>Note for this vendor</label>
                  <textarea value={form.vendorNote} onChange={(e) => setForm({ ...form, vendorNote: e.target.value })} rows={2} placeholder="Bring extension cables" className={`${inp} resize-y`} />
                </div>
              </div>

              <div className="shrink-0 border-t border-white/[0.07] px-6 pb-6 pt-5">
                <button onClick={() => act(editing ? { action: "update", id: editing.id, ...form } : { action: "add", ...form })} disabled={busy} className="sb-btn sb-sheen w-full min-h-[52px] text-[11px] uppercase tracking-[0.2em] font-semibold font-[family-name:var(--font-sans)]">
                  {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Add vendor"}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </main>
  );
}
