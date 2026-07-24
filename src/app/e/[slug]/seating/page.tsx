"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Plus, Sparkles, Printer, X, Users, ArrowLeft, Trash2 } from "lucide-react";

type T = { id: string; name: string; section: string; capacity: number; note: string; seated: number; guests: { id: string; name: string; tier: string; partySize: number; seat: string; wristband: string }[] };
type U = { id: string; name: string; tier: string; partySize: number };

export default function SeatingPlan() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState("");
  const [tables, setTables] = useState<T[]>([]);
  const [unseated, setUnseated] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<U | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ prefix: "Table", section: "Main", count: "10", capacity: "10" });

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/seating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: k, action: "list" }),
    });
    if (!res.ok) return false;
    const d = await res.json();
    setTitle(d.event.title);
    setTables(d.tables);
    setUnseated(d.unseated);
    return true;
  }, [slug]);

  useEffect(() => {
    if (tried) return;
    setTried(true);
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`sb_admin_${slug}`) : null;
    if (saved) {
      setKey(saved);
      load(saved).then((ok) => { if (ok) setUnlocked(true); });
    }
  }, [tried, slug, load]);

  useEffect(() => {
    if (tried) return;
    setTried(true);
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`sb_admin_${slug}`) : null;
    if (saved) {
      setKey(saved);
      load(saved).then((ok) => { if (ok) setUnlocked(true); });
    }
  }, [tried, slug, load]);

  async function unlock() {
    setBusy(true);
    const ok = await load(key);
    setBusy(false);
    if (ok) { setUnlocked(true); sessionStorage.setItem(`sb_admin_${slug}`, key); } else setMsg("Wrong admin key.");
  }

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/e/seating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, ...body }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.error) { setMsg(d.error); return; }
    if (d.placed !== undefined) setMsg(`Seated ${d.placed} guests${d.left ? ` · ${d.left} still need space` : ""}.`);
    setPicking(null);
    setShowAdd(false);
    load(key);
  }

  const card = "sb-surface sb-lift";
  const inp = "w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <div className={`${card} w-full max-w-[360px] p-6`}>
          <ShieldCheck className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Seating Plan</h1>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="ADM-XXXXXX" className={`mt-4 ${inp} uppercase tracking-widest`} />
          {msg && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>}
          <button onClick={unlock} disabled={busy} className="mt-4 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  const sections = Array.from(new Set(tables.map((t) => t.section)));
  const totalSeats = tables.reduce((a, t) => a + t.capacity, 0);
  const totalSeated = tables.reduce((a, t) => a + t.seated, 0);

  return (
    <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8 print:bg-white print:text-black">
      <div className="mx-auto max-w-[1300px]">
        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div>
            <Link href={`/e/${slug}/admin`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Host terminal
            </Link>
            <p className="mt-4 text-[10px] uppercase tracking-[0.35em] text-white/35 font-[family-name:var(--font-sans)]">Seating Plan</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif)] text-4xl sb-display text-[#c9a227]">{title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"><Plus className="h-3.5 w-3.5 text-[#c9a227]" /> Add tables</button>
            <button onClick={() => act({ action: "autoSeat" })} disabled={busy} className="flex items-center gap-2 sb-btn px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]"><Sparkles className="h-3.5 w-3.5" /> Auto seat</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"><Printer className="h-3.5 w-3.5 text-[#c9a227]" /> Print</button>
          </div>
        </div>

        <h1 className="hidden font-[family-name:var(--font-serif)] text-4xl sb-display print:block">{title} — Seating Plan</h1>

        <div className="mt-6 flex flex-wrap gap-5 text-[12px] text-white/50 font-[family-name:var(--font-sans)] print:text-black">
          <span>{tables.length} tables</span>
          <span>{totalSeated} / {totalSeats} seats filled</span>
          <span className="text-[#c9a227]">{unseated.length} guests unseated</span>
        </div>

        {msg && <p className="mt-4 rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.07] px-5 py-3 text-[12px] text-[#c9a227] font-[family-name:var(--font-sans)] print:hidden">{msg}</p>}

        {unseated.length > 0 && (
          <div className={`${card} mt-6 p-5 print:hidden`}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Waiting for a table</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {unseated.map((g) => (
                <button key={g.id} onClick={() => setPicking(g)} className="sb-ghost px-4 py-2 text-[12px] text-white/70 hover:border-[#c9a227]/50 font-[family-name:var(--font-sans)]">
                  {g.name}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""} <span className="text-white/30">· {g.tier}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {sections.map((sec) => (
          <div key={sec} className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">{sec}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.filter((t) => t.section === sec).map((t) => {
                const full = t.seated >= t.capacity;
                return (
                  <motion.div key={t.id} layout className={`${card} p-5 print:border-black/20 ${full ? "border-[#c9a227]/30" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-[family-name:var(--font-serif)] text-2xl">{t.name}</p>
                        <p className="mt-0.5 text-[11px] text-white/35 font-[family-name:var(--font-sans)] print:text-black">{t.seated} / {t.capacity} seats</p>
                      </div>
                      <button onClick={() => act({ action: "deleteTable", id: t.id })} className="rounded-full border border-white/10 p-1.5 text-white/30 hover:text-red-400 print:hidden"><Trash2 className="h-3 w-3" /></button>
                    </div>

                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div animate={{ width: `${Math.min(100, (t.seated / t.capacity) * 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-[#1c4634] to-[#c9a227]" />
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {t.guests.map((g) => (
                        <div key={g.id} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 print:bg-transparent">
                          <span className="text-[12px] text-white/75 font-[family-name:var(--font-sans)] print:text-black">
                            {g.name}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""}
                          </span>
                          <button onClick={() => act({ action: "seat", guestId: g.id, tableId: null })} className="text-[10px] uppercase text-white/25 hover:text-red-400 print:hidden">remove</button>
                        </div>
                      ))}
                      {t.guests.length === 0 && <p className="py-3 text-center text-[11px] text-white/20 font-[family-name:var(--font-sans)]">Empty</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className={`${card} mt-8 p-12 text-center`}>
            <p className="text-[13px] text-white/40 font-[family-name:var(--font-sans)]">No tables yet. Add some, then use Auto seat to fill them.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {picking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicking(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] w-full max-w-[440px] overflow-y-auto sb-panel p-6">
              <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[#c9a227]">Seat {picking.name}</h3>
              <p className="mt-1 text-[12px] text-white/40 font-[family-name:var(--font-sans)]">{picking.partySize > 1 ? `Needs ${picking.partySize} seats` : "1 seat"}</p>
              <div className="mt-5 space-y-2">
                {tables.map((t) => {
                  const room = t.capacity - t.seated;
                  return (
                    <button key={t.id} onClick={() => act({ action: "seat", guestId: picking.id, tableId: t.id })} disabled={room < picking.partySize} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left disabled:opacity-30">
                      <span className="text-[13px] text-white/80 font-[family-name:var(--font-sans)]">{t.name} <span className="text-white/30">· {t.section}</span></span>
                      <span className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">{room} free</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPicking(null)} className="mt-5 w-full sb-ghost py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] sb-panel p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Add tables</h3>
                <button onClick={() => setShowAdd(false)} className="rounded-full border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>
              {[
                { k: "prefix", l: "Name prefix", p: "Table" },
                { k: "section", l: "Section", p: "Main / VIP / Balcony" },
                { k: "count", l: "How many", p: "10" },
                { k: "capacity", l: "Seats per table", p: "10" },
              ].map((f) => (
                <div key={f.k} className="mt-4">
                  <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{f.l}</label>
                  <input value={form[f.k as keyof typeof form]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.p} className={`mt-2 ${inp}`} />
                </div>
              ))}
              <button onClick={() => act({ action: "bulkTables", ...form })} disabled={busy} className="mt-6 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create tables"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
