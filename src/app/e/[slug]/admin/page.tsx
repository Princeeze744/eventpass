"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, Loader2 } from "lucide-react";

type G = {
  id: string; passId: string; name: string; phone?: string | null;
  partySize: number; tier: string; table: string; status: string;
  checkedInOnline: boolean; checkedIn: boolean;
};

export default function EventAdmin() {
  const params = useParams();
  const slug = String(params.slug);

  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [title, setTitle] = useState("");
  const [guests, setGuests] = useState<G[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "declined" | "checkedin">("all");

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/e/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: k }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTitle(data.event.title);
    setGuests(data.guests);
    return true;
  }, [slug]);

  async function unlock() {
    setBusy(true);
    const ok = await load(key);
    setBusy(false);
    if (ok) setUnlocked(true);
    else setMsg("Wrong admin key.");
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/e/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey: key, id, status }),
    });
    load(key);
  }

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => load(key), 5000);
    return () => clearInterval(t);
  }, [unlocked, key, load]);

  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${card} w-full max-w-[360px] p-6`}>
          <ShieldCheck className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Host Terminal</h1>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="ADM-XXXXXX"
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 uppercase tracking-widest text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />
          {msg && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>}
          <button onClick={unlock} disabled={busy} className="mt-4 w-full min-h-[50px] rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </motion.div>
      </main>
    );
  }

  const pending = guests.filter((g) => g.status === "pending").length;
  const approved = guests.filter((g) => g.status === "approved").length;
  const inCount = guests.filter((g) => g.checkedIn).length;
  const heads = guests.filter((g) => g.status === "approved").reduce((a, g) => a + g.partySize, 0);

  const visible = guests.filter((g) => {
    const q = search.toLowerCase().trim();
    const ms = !q || g.name.toLowerCase().includes(q) || (g.phone || "").includes(q) || g.passId.toLowerCase().includes(q);
    const mf = filter === "all" || (filter === "checkedin" ? g.checkedIn : g.status === filter);
    return ms && mf;
  });

  return (
    <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/35 font-[family-name:var(--font-sans)]">Host Terminal</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="mt-1 font-[family-name:var(--font-serif)] text-4xl text-[#c9a227]">{title}</h1>
          <div className="flex flex-wrap gap-4 text-[12px] text-white/55 font-[family-name:var(--font-sans)]">
            <span>{guests.length} registered</span>
            <span>{pending} pending</span>
            <span className="text-[#c9a227]">{approved} approved</span>
            <span className="text-emerald-400">{inCount} checked in</span>
            <span className="text-white/35">{heads} expected heads</span>
            <button onClick={() => load(key)} className="text-[#c9a227]"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or pass ID…"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "pending", "approved", "declined", "checkedin"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${filter === f ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>
                {f === "checkedin" ? "Checked In" : f}
              </button>
            ))}
          </div>
        </div>

        <div className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full text-left text-sm font-[family-name:var(--font-sans)]">
            <thead>
              <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.2em] text-white/35">
                <th className="px-5 py-4">Guest</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Pass</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((g) => (
                <tr key={g.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5">
                    <span className="font-[family-name:var(--font-serif)] text-base">{g.name}</span>
                    <span className="ml-2 text-[11px] text-white/30">{g.tier}{g.partySize > 1 ? ` · +${g.partySize - 1}` : ""} · {g.table}</span>
                  </td>
                  <td className="px-5 py-3.5 text-white/45">{g.phone || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-white/45">{g.passId}</td>
                  <td className="px-5 py-3.5">
                    {g.checkedIn ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">Checked in</span>
                    : g.checkedInOnline ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">Express</span>
                    : g.status === "declined" ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] text-red-400">Declined</span>
                    : g.status === "approved" ? <span className="rounded-full bg-[#c9a227]/15 px-3 py-1 text-[10px] text-[#c9a227]">Approved</span>
                    : <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] text-white/40">Pending</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      {g.status !== "approved" && <button onClick={() => setStatus(g.id, "approved")} className="rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] text-emerald-400">Approve</button>}
                      {g.status !== "declined" && <button onClick={() => setStatus(g.id, "declined")} className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] text-red-400">Decline</button>}
                      {g.status === "declined" && <button onClick={() => setStatus(g.id, "pending")} className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-white/55">Restore</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30">No guests match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}