"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, Loader2, Trash2, RotateCcw, Pencil, X, Check } from "lucide-react";
import ImportPanel from "@/components/ImportPanel";

type G = {
  id: string; passId: string; name: string; phone?: string | null;
  partySize: number; tier: string; table: string; status: string; rsvpAnswer?: string;
  checkedInOnline: boolean; checkedIn: boolean; deletedAt?: string | null;
};

export default function EventAdmin() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState("");
  const [guests, setGuests] = useState<G[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "declined" | "checkedin" | "trash">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<G | null>(null);

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: k, includeTrash: true }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTitle(data.event.title);
    setGuests(data.guests);
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
    if (ok) { setUnlocked(true); sessionStorage.setItem(`sb_admin_${slug}`, key); }
    else setMsg("Wrong admin key.");
  }

  async function manage(action: string, ids: string[], extra: Record<string, unknown> = {}) {
    setBusy(true);
    await fetch("/api/e/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, action, ids, ...extra }),
    });
    setBusy(false);
    setSelected([]);
    load(key);
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/e/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, id, status }),
    });
    load(key);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    await fetch("/api/e/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug, adminKey: key, action: "edit", id: editing.id,
        name: editing.name, phone: editing.phone || "", tier: editing.tier,
        table: editing.table, partySize: editing.partySize,
      }),
    });
    setBusy(false);
    setEditing(null);
    load(key);
  }

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => load(key), 6000);
    return () => clearInterval(t);
  }, [unlocked, key, load]);

  const card = "sb-surface sb-lift";
  const inp = "w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${card} w-full max-w-[360px] p-6`}>
          <ShieldCheck className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Host Terminal</h1>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="ADM-XXXXXX" className={`mt-4 ${inp} uppercase tracking-widest`} />
          {msg && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>}
          <button onClick={unlock} disabled={busy} className="mt-4 w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </motion.div>
      </main>
    );
  }

  const live = guests.filter((g) => !g.deletedAt);
  const pending = live.filter((g) => g.status === "pending").length;
  const approved = live.filter((g) => g.status === "approved").length;
  const inCount = live.filter((g) => g.checkedIn).length;
  const heads = live.filter((g) => g.status === "approved" && g.rsvpAnswer !== "no").reduce((a, g) => a + g.partySize, 0);
  const notComing = live.filter((g) => g.rsvpAnswer === "no").length;
  const trashed = guests.filter((g) => g.deletedAt).length;

  const visible = guests.filter((g) => {
    const q = search.toLowerCase().trim();
    const ms = !q || g.name.toLowerCase().includes(q) || (g.phone || "").includes(q) || g.passId.toLowerCase().includes(q);
    if (filter === "trash") return ms && Boolean(g.deletedAt);
    if (g.deletedAt) return false;
    const mf = filter === "all" || (filter === "checkedin" ? g.checkedIn : g.status === filter);
    return ms && mf;
  });

  const allSelected = visible.length > 0 && visible.every((g) => selected.includes(g.id));

  return (
    <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35 font-[family-name:var(--font-sans)]">Host Terminal</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="mt-1 font-[family-name:var(--font-serif)] text-4xl sb-display text-[#c9a227]">{title}</h1>
          <div className="flex flex-wrap gap-4 text-[12px] text-white/55 font-[family-name:var(--font-sans)]">
            <span>{live.length} registered</span>
            <span>{pending} pending</span>
            <span className="text-[#c9a227]">{approved} approved</span>
            <span className="text-emerald-400">{inCount} checked in</span>
            <span className="text-white/45">{notComing} not attending</span>
            <span className="text-white/35">{heads} expected heads</span>
            <button onClick={() => load(key)} className="text-[#c9a227]"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <ImportPanel slug={slug} adminKey={key} onDone={() => load(key)} />
          <a href={`/e/${slug}/seating`} className="flex items-center gap-2 rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Seating plan</a>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or pass ID" className={`flex-1 ${inp}`} />
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "pending", "approved", "declined", "checkedin", "trash"] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setSelected([]); }} className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${filter === f ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>
                {f === "checkedin" ? "Checked In" : f === "trash" ? `Trash ${trashed > 0 ? trashed : ""}` : f}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#c9a227]/30 bg-[#c9a227]/[0.07] px-5 py-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#c9a227] font-[family-name:var(--font-sans)]">{selected.length} selected</span>
              {filter === "trash" ? (
                <>
                  <button onClick={() => manage("restore", selected)} className="rounded-full border border-emerald-500/40 px-4 py-1.5 text-[10px] uppercase text-emerald-400 font-[family-name:var(--font-sans)]">Restore</button>
                  <button onClick={() => manage("destroy", selected)} className="rounded-full bg-red-600 px-4 py-1.5 text-[10px] uppercase font-semibold text-white font-[family-name:var(--font-sans)]">Delete forever</button>
                </>
              ) : (
                <>
                  <button onClick={() => manage("bulkStatus", selected, { status: "approved" })} className="rounded-full border border-emerald-500/40 px-4 py-1.5 text-[10px] uppercase text-emerald-400 font-[family-name:var(--font-sans)]">Approve all</button>
                  <button onClick={() => manage("bulkStatus", selected, { status: "declined" })} className="rounded-full border border-red-500/40 px-4 py-1.5 text-[10px] uppercase text-red-400 font-[family-name:var(--font-sans)]">Decline all</button>
                  <button onClick={() => manage("resetCheckin", selected)} className="rounded-full border border-white/20 px-4 py-1.5 text-[10px] uppercase text-white/60 font-[family-name:var(--font-sans)]">Reset check-in</button>
                  <button onClick={() => manage("trash", selected)} className="rounded-full border border-red-500/40 px-4 py-1.5 text-[10px] uppercase text-red-400 font-[family-name:var(--font-sans)]">Remove</button>
                </>
              )}
              <button onClick={() => setSelected([])} className="ml-auto text-[10px] uppercase text-white/40 font-[family-name:var(--font-sans)]">Clear</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full text-left text-sm font-[family-name:var(--font-sans)]">
            <thead>
              <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.2em] text-white/35">
                <th className="px-4 py-4">
                  <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? visible.map((g) => g.id) : [])} className="h-4 w-4 accent-[#c9a227]" />
                </th>
                <th className="px-4 py-4">Guest</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Pass</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((g) => (
                <tr key={g.id} className={`border-b border-white/[0.04] sb-row ${g.deletedAt ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.includes(g.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, g.id] : selected.filter((i) => i !== g.id))} className="h-4 w-4 accent-[#c9a227]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-[family-name:var(--font-serif)] text-base">{g.name}</span>
                    <span className="ml-2 text-[11px] text-white/30">{g.tier}{g.partySize > 1 ? ` +${g.partySize - 1}` : ""} · {g.table}</span>
                  </td>
                  <td className="px-4 py-3.5 text-white/45">{g.phone || "-"}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-white/45">{g.passId}</td>
                  <td className="px-4 py-3.5">
                    {g.deletedAt ? <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] text-white/40">Removed</span>
                    : g.rsvpAnswer === "no" ? <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] text-white/45">Not attending</span>
                    : g.checkedIn ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">Checked in</span>
                    : g.checkedInOnline ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">Express</span>
                    : g.status === "declined" ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] text-red-400">Declined</span>
                    : g.status === "approved" ? <span className="rounded-full bg-[#c9a227]/15 px-3 py-1 text-[10px] text-[#c9a227]">Approved</span>
                    : <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] text-white/40">Pending</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      {g.deletedAt ? (
                        <button onClick={() => manage("restore", [g.id])} className="flex items-center gap-1 rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] text-emerald-400"><RotateCcw className="h-3 w-3" /> Restore</button>
                      ) : (
                        <>
                          {g.status !== "approved" && <button onClick={() => setStatus(g.id, "approved")} className="rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] text-emerald-400">Approve</button>}
                          {g.status !== "declined" && <button onClick={() => setStatus(g.id, "declined")} className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] text-red-400">Decline</button>}
                          <button onClick={() => setEditing(g)} className="sb-ghost px-3 py-1 text-[10px] text-white/55"><Pencil className="h-3 w-3" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-white/30">No guests match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-[440px] sb-panel p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Edit guest</h3>
                <button onClick={() => setEditing(null)} className="rounded-full border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>

              <label className="mt-5 block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Name</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={`mt-2 ${inp}`} />

              <label className="mt-4 block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Phone</label>
              <input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={`mt-2 ${inp}`} />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Table</label>
                  <input value={editing.table} onChange={(e) => setEditing({ ...editing, table: e.target.value })} className={`mt-2 ${inp}`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Party size</label>
                  <input type="number" min={1} max={10} value={editing.partySize} onChange={(e) => setEditing({ ...editing, partySize: Number(e.target.value) })} className={`mt-2 ${inp}`} />
                </div>
              </div>

              <label className="mt-4 block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Category</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {["Guest", "Family", "VIP", "Vendor"].map((t) => (
                  <button key={t} onClick={() => setEditing({ ...editing, tier: t })} className={`rounded-xl border py-2.5 text-[11px] font-[family-name:var(--font-sans)] ${editing.tier === t ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/45"}`}>{t}</button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={saveEdit} disabled={busy} className="flex min-h-[48px] flex-1 items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
                </button>
                <button onClick={() => { const id = editing.id; setEditing(null); manage("trash", [id]); }} className="flex items-center gap-2 rounded-full border border-red-500/40 px-5 text-[10px] uppercase text-red-400 font-[family-name:var(--font-sans)]">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
