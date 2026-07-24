"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Check, Trash2, X, Loader2 } from "lucide-react";

type G = { id: string; fromName: string; giftType: string; amount: number | null; item: string; note: string; thanked: boolean };

const BLANK = { fromName: "", giftType: "cash", amount: "", item: "", note: "" };

export default function GiftTracker({ slug, adminKey }: { slug: string; adminKey: string }) {
  const [gifts, setGifts] = useState<G[]>([]);
  const [totals, setTotals] = useState({ count: 0, cash: 0, items: 0, thanked: 0 });
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [form, setForm] = useState(BLANK);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  const load = useCallback(async () => {
    const res = await fetch("/api/e/gifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey, action: "list" }),
    });
    if (!res.ok) return;
    const d = await res.json();
    setGifts(d.gifts);
    setTotals(d.totals);
  }, [slug, adminKey]);

  useEffect(() => { load(); }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/e/gifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey, ...body }),
    });
    setBusy(false);
    setForm(BLANK);
    setShow(false);
    setConfirmId("");
    load();
  }

  const inp = "mt-2 w-full sb-input px-4 py-3.5 text-[#f5f1ea] font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShow(false)}
      className="fixed inset-0 z-[999] flex items-end justify-center bg-[#050504]/94 backdrop-blur-2xl sm:items-center sm:px-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92svh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] border border-white/[0.09] bg-[#0d0c0b] shadow-[0_-20px_80px_rgba(0,0,0,0.9)] sm:max-h-[88vh] sm:rounded-[28px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Record a gift</h3>
          <button onClick={() => setShow(false)} className="rounded-full border border-white/12 p-2 text-white/50"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div>
            <label className={lbl}>From</label>
            <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Aunty Ngozi" className={inp} />
          </div>

          <div>
            <label className={lbl}>Type</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["cash", "item"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, giftType: t })} className={`rounded-xl border py-3.5 text-[11px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${form.giftType === t ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            {form.giftType === "cash" ? (
              <>
                <label className={lbl}>Amount</label>
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="numeric" placeholder="50000" className={inp} />
              </>
            ) : (
              <>
                <label className={lbl}>Item</label>
                <input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="Dinner set" className={inp} />
              </>
            )}
          </div>

          <div>
            <label className={lbl}>Note</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" className={inp} />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.07] px-6 py-5">
          <button onClick={() => act({ action: "add", ...form })} disabled={busy || !form.fromName.trim()} className="sb-btn sb-sheen w-full min-h-[52px] text-[11px] uppercase tracking-[0.2em] font-semibold font-[family-name:var(--font-sans)] disabled:opacity-40">
            {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save gift"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="sb-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="sb-icon sb-icon-gold"><Gift className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} /></div>
          <div>
            <p className="font-[family-name:var(--font-serif)] text-2xl">Gift tracker</p>
            <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
              {totals.count} gifts · N{totals.cash.toLocaleString()} cash · {totals.thanked} thanked
            </p>
          </div>
        </div>
        <button onClick={() => setShow(true)} className="sb-ghost flex items-center gap-2 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
          <Plus className="h-3.5 w-3.5 text-[#c9a227]" /> Record gift
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {gifts.length === 0 && <p className="py-6 text-center text-[12px] text-white/25 font-[family-name:var(--font-sans)]">No gifts recorded yet.</p>}
        {gifts.map((g) => (
          <motion.div key={g.id} layout className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-black/25 px-5 py-3">
            <div>
              <p className="font-[family-name:var(--font-serif)] text-lg">{g.fromName}</p>
              <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                {g.giftType === "cash" ? `N${(g.amount || 0).toLocaleString()}` : g.item || "Gift item"}
                {g.note ? ` · ${g.note}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => act({ action: "thank", id: g.id })} className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${g.thanked ? "border-emerald-500/40 text-emerald-400" : "border-white/12 text-white/45"}`}>
                {g.thanked ? "Thanked" : "Thank"}
              </button>
              {confirmId === g.id ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => act({ action: "remove", id: g.id })} className="rounded-full bg-red-600 px-3 py-1.5 text-[10px] uppercase font-semibold text-white font-[family-name:var(--font-sans)]">Delete</button>
                  <button onClick={() => setConfirmId("")} className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] uppercase text-white/45 font-[family-name:var(--font-sans)]">Keep</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(g.id)} className="rounded-full border border-red-500/25 p-1.5 text-red-400/70"><Trash2 className="h-3 w-3" /></button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {mounted && createPortal(<AnimatePresence>{show && modal}</AnimatePresence>, document.body)}
    </div>
  );
}
