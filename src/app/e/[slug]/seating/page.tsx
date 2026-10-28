"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EventNav } from "@/components/Nav";
import { Loader2, ShieldCheck, Plus, Sparkles, Printer, X, Users, ArrowLeft, Trash2, AlertTriangle, MoveRight, Wand2, Check } from "lucide-react";

type Seated = { id: string; name: string; tier: string; partySize: number; seat: string; wristband: string };
type T = { id: string; name: string; section: string; capacity: number; note: string; seated: number; duplicate?: boolean; guests: Seated[] };
type U = { id: string; name: string; tier: string; partySize: number; group?: string; lost?: string; from?: string };

type PlanRow = {
  group: string;
  waiting: number;
  waitingSeats: number;
  placed: { name: string; table: string }[];
  shortfall: number;
  tablesNeeded: number;
  reason: string;
  names: string[];
};

/* The app is dark-themed and its surface classes set a light text
   colour that beats Tailwind's print variants, which is why the printed
   plan came out blank. These rules are scoped to the plan and marked
   important so paper is black on white whatever the theme does. */
const PRINT_CSS = `
@media print {
  @page { margin: 12mm; }
  html, body { background: #fff !important; }
  .sb-plan, .sb-plan * {
    color: #000 !important;
    background: transparent !important;
    background-image: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .sb-plan .sb-card {
    border: 1px solid #999 !important;
    border-radius: 8px !important;
    padding: 10px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .sb-plan .sb-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  .sb-plan .sb-table-name { font-size: 15px !important; font-weight: 700 !important; }
  .sb-plan .sb-guest { font-size: 12px !important; padding: 2px 0 !important; border-bottom: 1px dotted #ccc !important; }
  .sb-plan .sb-section-title { font-size: 11px !important; letter-spacing: 2px !important; margin-top: 14px !important; }
  .sb-plan .sb-bar { display: none !important; }
}
`;

export default function SeatingPlan() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState("");
  const [tables, setTables] = useState<T[]>([]);
  const [unseated, setUnseated] = useState<U[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<U | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [renaming, setRenaming] = useState("");
  const [newName, setNewName] = useState("");

  /* seating a handful of people at once - the host ticks whoever just
     said yes and names their group, rather than opening one dialog
     per guest and remembering which table still had room */
  const [sel, setSel] = useState<string[]>([]);
  const [bulkGroup, setBulkGroup] = useState("");

  /* the dry run of "Plan it for me" - nothing moves until Apply */
  const [plan, setPlan] = useState<PlanRow[] | null>(null);
  const [planning, setPlanning] = useState(false);

  function startRename(id: string, current: string) {
    setRenaming(id);
    setNewName(current);
  }
  async function saveRename(id: string) {
    const n = newName.trim();
    setRenaming("");
    if (!n) return;
    await act({ action: "updateTable", id, name: n });
  }
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
    setDuplicates(Array.isArray(d.duplicates) ? d.duplicates : []);
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
    if (d.sent !== undefined) setMsg(`Emailed ${d.sent} seated guests.`);
    if (d.grouped !== undefined && d.placed === undefined) setMsg(`${d.grouped} guest${d.grouped === 1 ? "" : "s"} marked as ${d.section || "no group"}.`);
    if (d.placed !== undefined) {
      const tail = d.left ? ` · ${d.left} still need${d.left === 1 ? "s" : ""} space${d.leftNames?.length ? `: ${d.leftNames.join(", ")}` : ""}` : "";
      setMsg(`Seated ${d.placed} guest${d.placed === 1 ? "" : "s"}${tail}.`);
    }
    if (d.added !== undefined && d.placed === undefined) {
      setMsg(d.added ? `Added ${d.added} table${d.added === 1 ? "" : "s"}.` : (d.note || "Nothing to add."));
    }
    if (d.reseated) setMsg(`Table renamed · ${d.reseated} guest${d.reseated === 1 ? "" : "s"} moved with it.`);
    setPicking(null);
    setShowAdd(false);
    setSel([]);
    setPlan(null);
    load(key);
  }

  /* reads the whole event and reports what it WOULD do - no writes */
  async function preview() {
    setPlanning(true);
    setMsg("");
    const res = await fetch("/api/e/seating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, action: "planSeating" }),
    });
    const d = await res.json();
    setPlanning(false);
    if (d.error) { setMsg(d.error); return; }
    setPlan(Array.isArray(d.plan) ? d.plan : []);
  }

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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

  /* every group the host could mean: the sections that have tables,
     plus any group carried in on the guest list that has none yet */
  const groupOptions = Array.from(
    new Set([...sections, ...unseated.map((u) => (u.group || "").trim()).filter(Boolean)])
  ).sort((a, b) => a.localeCompare(b));

  const selected = unseated.filter((u) => sel.includes(u.id));
  const selectedSeats = selected.reduce((a, g) => a + g.partySize, 0);

  return (
    <main className="sb-plan min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8 print:bg-white print:text-black">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="mx-auto max-w-[1300px]">
        <TopBar back={`/e/${slug}/admin`} backLabel="Guests" />
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
            <button onClick={preview} disabled={busy || planning} className="flex items-center gap-2 sb-btn px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
              {planning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Plan it for me
            </button>
            <button onClick={() => act({ action: "autoSeat" })} disabled={busy} className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"><Sparkles className="h-3.5 w-3.5 text-[#c9a227]" /> Auto seat</button>
            <button onClick={() => { if (confirm("Email every seated guest their table? Only guests with an email address will receive one.")) act({ action: "notifyAll" }); }} disabled={busy} className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"><Users className="h-3.5 w-3.5 text-[#c9a227]" /> Notify seated</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"><Printer className="h-3.5 w-3.5 text-[#c9a227]" /> Print</button>
          </div>
        </div>

        <div className="hidden print:block">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl">{title} — Seating Plan</h1>
          <p className="mt-1 text-[12px]">{tables.length} tables · {totalSeated} of {totalSeats} seats filled{unseated.length ? ` · ${unseated.length} unseated` : ""}</p>
        </div>

        <div className="print:hidden"><EventNav slug={slug} /></div>

        <div className="mt-6 flex flex-wrap gap-5 text-[12px] text-white/50 font-[family-name:var(--font-sans)] print:hidden">
          <span>{tables.length} tables</span>
          <span>{totalSeated} / {totalSeats} seats filled</span>
          <span className="text-[#c9a227]">{unseated.length} guests unseated</span>
        </div>

        {duplicates.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.07] px-5 py-4 print:hidden">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={1.8} />
            <div className="font-[family-name:var(--font-sans)]">
              <p className="text-[12px] text-red-300">
                Two tables share the same name: {duplicates.map((d) => `"${d}"`).join(", ")}.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                Guests are matched to a table by its name, so these two cannot be told apart and will show the same people. Rename one of them and the clash clears.
              </p>
            </div>
          </div>
        )}

        {msg && <p className="mt-4 rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.07] px-5 py-3 text-[12px] text-[#c9a227] font-[family-name:var(--font-sans)] print:hidden">{msg}</p>}

        {unseated.length > 0 && (
          <div className={`${card} mt-6 p-5 print:hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Waiting for a table</p>
              </div>
              <p className="text-[11px] text-white/30 font-[family-name:var(--font-sans)]">
                {sel.length ? `${sel.length} selected` : "Tap to select · tap again to deselect"}
              </p>
            </div>

            {/* act on several at once, grouped the way the room is */}
            <AnimatePresence>
              {sel.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.05] p-4">
                    <div className="min-w-[200px] flex-1">
                      <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">
                        Which group do these {sel.length} belong to?
                      </label>
                      <input
                        list="sb-groups"
                        value={bulkGroup}
                        onChange={(e) => setBulkGroup(e.target.value)}
                        placeholder="Standard Chartered Bank"
                        className={`mt-2 ${inp}`}
                      />
                      <datalist id="sb-groups">
                        {groupOptions.map((g) => <option key={g} value={g} />)}
                      </datalist>
                    </div>

                    <button
                      onClick={() => act({ action: "seatMany", guestIds: sel, section: bulkGroup.trim() })}
                      disabled={busy || !bulkGroup.trim()}
                      className="flex items-center gap-2 sb-btn px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] disabled:opacity-40 font-[family-name:var(--font-sans)]"
                    >
                      <Check className="h-3.5 w-3.5" /> Seat {sel.length} here
                      <span className="opacity-60">({selectedSeats} seat{selectedSeats === 1 ? "" : "s"})</span>
                    </button>

                    <button
                      onClick={() => act({ action: "setGroup", guestIds: sel, section: bulkGroup.trim() })}
                      disabled={busy || !bulkGroup.trim()}
                      title="Record the group without choosing a table yet"
                      className="sb-ghost px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 disabled:opacity-40 font-[family-name:var(--font-sans)]"
                    >
                      Group only
                    </button>

                    <button onClick={() => setSel([])} className="px-3 py-3 text-[10px] uppercase tracking-[0.15em] text-white/40 font-[family-name:var(--font-sans)]">
                      Clear
                    </button>
                  </div>

                  <p className="mt-2 px-1 text-[10px] leading-relaxed text-white/30 font-[family-name:var(--font-sans)]">
                    &quot;Seat here&quot; fills whichever of that group&apos;s tables has room, keeping parties together. &quot;Group only&quot; just records who they are, so Plan it for me can place them later.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex flex-wrap gap-2">
              {unseated.map((g) => {
                const on = sel.includes(g.id);
                return (
                  <div key={g.id} className={`flex items-stretch overflow-hidden rounded-xl border ${on ? "border-[#c9a227]/60 bg-[#c9a227]/[0.08]" : "border-white/10"}`}>
                    <button
                      onClick={() => toggle(g.id)}
                      className="px-4 py-2 text-left text-[12px] text-white/70 font-[family-name:var(--font-sans)]"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border ${on ? "border-[#c9a227] bg-[#c9a227]" : "border-white/25"}`}>
                          {on && <Check className="h-2.5 w-2.5 text-[#080807]" strokeWidth={3} />}
                        </span>
                        {g.name}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""}
                        <span className="text-white/30">· {g.tier}</span>
                      </span>
                      {g.group
                        ? <span className="mt-0.5 block pl-[22px] text-[10px] text-[#c9a227]/70">{g.group}</span>
                        : <span className="mt-0.5 block pl-[22px] text-[10px] text-white/25">no group yet</span>}
                      {g.lost ? <span className="mt-0.5 block pl-[22px] text-[10px] text-amber-400/80">was at &quot;{g.lost}&quot; — table no longer exists</span> : null}
                    </button>
                    <button
                      onClick={() => setPicking(g)}
                      title="Choose a table for this guest"
                      className="border-l border-white/10 px-3 text-[10px] uppercase text-white/35 hover:text-[#c9a227] font-[family-name:var(--font-sans)]"
                    >
                      seat
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sections.map((sec) => (
          <div key={sec} className="mt-8">
            <p className="sb-section-title text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">{sec}</p>
            <div className="sb-grid mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.filter((t) => t.section === sec).map((t) => {
                const full = t.seated >= t.capacity;
                return (
                  <motion.div key={t.id} layout className={`sb-card ${card} p-5 ${t.duplicate ? "border-red-500/40" : full ? "border-[#c9a227]/30" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        {renaming === t.id ? (
                          <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => saveRename(t.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveRename(t.id); if (e.key === "Escape") setRenaming(""); }}
                            className="w-full rounded-lg border border-[#c9a227]/50 bg-black/50 px-2 py-1 font-[family-name:var(--font-serif)] text-2xl text-[#f5f1ea] outline-none"
                          />
                        ) : (
                          <p onClick={() => startRename(t.id, t.name)} title="Click to rename" className="sb-table-name cursor-text font-[family-name:var(--font-serif)] text-2xl hover:text-[#c9a227] print:hover:text-inherit">{t.name}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-white/35 font-[family-name:var(--font-sans)]">{t.seated} / {t.capacity} seats</p>
                      </div>
                      <button onClick={() => act({ action: "deleteTable", id: t.id })} className="rounded-full border border-white/10 p-1.5 text-white/30 hover:text-red-400 print:hidden"><Trash2 className="h-3 w-3" /></button>
                    </div>

                    <div className="sb-bar mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div animate={{ width: `${Math.min(100, (t.seated / t.capacity) * 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-[#1c4634] to-[#c9a227]" />
                    </div>

                    <div className="mt-4 space-y-1.5">
                      {t.guests.map((g) => (
                        <div key={g.id} className="sb-guest flex items-center justify-between rounded-lg bg-black/25 px-3 py-2">
                          {/* click a seated guest to move them straight to
                              another table - no need to remove them first */}
                          <button
                            onClick={() => setPicking({ id: g.id, name: g.name, tier: g.tier, partySize: g.partySize, from: t.name })}
                            title="Move to another table"
                            className="flex-1 text-left text-[12px] text-white/75 hover:text-[#c9a227] font-[family-name:var(--font-sans)] print:hover:text-inherit"
                          >
                            {g.name}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""}
                          </button>
                          <button onClick={() => act({ action: "seat", guestId: g.id, tableId: null })} className="ml-2 text-[10px] uppercase text-white/25 hover:text-red-400 print:hidden">remove</button>
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
        {/* ---------- the dry run ---------- */}
        {plan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPlan(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm print:hidden">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-[600px] overflow-y-auto sb-panel p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">The plan</h3>
                  <p className="mt-1 text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                    Nothing has moved yet. This is what would happen.
                  </p>
                </div>
                <button onClick={() => setPlan(null)} className="rounded-full border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>

              {plan.length === 0 && (
                <p className="mt-6 rounded-2xl border border-white/10 px-5 py-6 text-center text-[12px] text-white/40 font-[family-name:var(--font-sans)]">
                  Everyone who has confirmed already has a table. Nothing to do.
                </p>
              )}

              <div className="mt-5 space-y-2">
                {plan.map((r) => {
                  const ok = r.shortfall === 0;
                  return (
                    <div key={r.group || "__none"} className={`rounded-xl border px-4 py-3 ${ok ? "border-white/10" : "border-amber-500/30 bg-amber-500/[0.05]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] text-white/85 font-[family-name:var(--font-sans)]">
                          {r.group || <span className="text-white/40">No group recorded</span>}
                        </p>
                        <p className="shrink-0 text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                          {r.waiting} waiting
                        </p>
                      </div>

                      {r.placed.length > 0 && (
                        <p className="mt-1.5 text-[11px] text-[#c9a227]/90 font-[family-name:var(--font-sans)]">
                          → seats {r.placed.length} on {Array.from(new Set(r.placed.map((p) => p.table))).join(", ")}
                        </p>
                      )}

                      {r.shortfall > 0 && (
                        <>
                          <p className="mt-1.5 text-[11px] text-amber-300/90 font-[family-name:var(--font-sans)]">
                            {r.shortfall} cannot be placed — {r.reason}
                          </p>
                          {r.names.length > 0 && (
                            <p className="mt-1 text-[10px] leading-relaxed text-white/35 font-[family-name:var(--font-sans)]">
                              {r.names.slice(0, 8).join(", ")}{r.names.length > 8 ? ` and ${r.names.length - 8} more` : ""}
                            </p>
                          )}
                          {r.group && r.tablesNeeded > 0 && (
                            <button
                              onClick={() => act({ action: "tablesForGroup", section: r.group, capacity: 10 })}
                              disabled={busy}
                              className="mt-2.5 sb-ghost px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"
                            >
                              <Plus className="mr-1 inline h-3 w-3 text-[#c9a227]" />
                              Add {r.tablesNeeded} table{r.tablesNeeded === 1 ? "" : "s"} for this group
                            </button>
                          )}
                          {!r.group && (
                            <p className="mt-2 text-[10px] leading-relaxed text-white/35 font-[family-name:var(--font-sans)]">
                              Tick them in &quot;Waiting for a table&quot; above and name their group — then this plan can place them.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {plan.some((r) => r.placed.length > 0) && (
                <button
                  onClick={() => act({ action: "planSeating", apply: true })}
                  disabled={busy}
                  className="mt-6 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]"
                >
                  {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : `Apply — seat ${plan.reduce((a, r) => a + r.placed.length, 0)} guests`}
                </button>
              )}

              <button onClick={() => setPlan(null)} className="mt-3 w-full sb-ghost py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">
                Close without changing anything
              </button>
            </motion.div>
          </motion.div>
        )}

        {picking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicking(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm print:hidden">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] w-full max-w-[440px] overflow-y-auto sb-panel p-6">
              <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[#c9a227]">
                {picking.from ? `Move ${picking.name}` : `Seat ${picking.name}`}
              </h3>
              <p className="mt-1 text-[12px] text-white/40 font-[family-name:var(--font-sans)]">
                {picking.from ? (
                  <span className="inline-flex items-center gap-1.5">
                    Currently at {picking.from} <MoveRight className="h-3 w-3" /> pick a new table
                  </span>
                ) : picking.partySize > 1 ? `Needs ${picking.partySize} seats` : "1 seat"}
              </p>
              {!picking.from && picking.group && (
                <p className="mt-1 text-[11px] text-[#c9a227]/80 font-[family-name:var(--font-sans)]">
                  Listed under {picking.group}
                </p>
              )}

              <div className="mt-5 space-y-2">
                {tables.map((t) => {
                  const here = t.name === picking.from;
                  /* their own seats do not count against the room they
                     are moving into if they are already sitting there */
                  const room = t.capacity - t.seated + (here ? picking.partySize : 0);
                  const ownGroup = Boolean(picking.group) && t.section === picking.group;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { if (!here) act({ action: "seat", guestId: picking.id, tableId: t.id }); }}
                      disabled={here || room < picking.partySize}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left disabled:opacity-30 ${here ? "border-[#c9a227]/50 bg-[#c9a227]/[0.07]" : ownGroup ? "border-[#c9a227]/30" : "border-white/10"}`}
                    >
                      <span className="text-[13px] text-white/80 font-[family-name:var(--font-sans)]">
                        {t.name} <span className="text-white/30">· {t.section}</span>
                        {ownGroup && !here && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#c9a227]/70">their group</span>}
                      </span>
                      <span className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">
                        {here ? "currently here" : `${room} free`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {picking.from && (
                <button
                  onClick={() => act({ action: "seat", guestId: picking.id, tableId: null })}
                  className="mt-4 w-full rounded-xl border border-red-500/35 py-3 text-[10px] uppercase tracking-[0.15em] text-red-400 font-[family-name:var(--font-sans)]"
                >
                  Take off this table
                </button>
              )}

              <button onClick={() => setPicking(null)} className="mt-3 w-full sb-ghost py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm print:hidden">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] sb-panel p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Add tables</h3>
                <button onClick={() => setShowAdd(false)} className="rounded-full border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/35 font-[family-name:var(--font-sans)]">
                Numbering continues from the highest table you already have, so a new table can never take a name that is already in use.
              </p>
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
