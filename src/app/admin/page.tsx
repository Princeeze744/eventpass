"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, RefreshCw, Loader2 } from "lucide-react";

type G = {
  id: string;
  passId: string;
  name: string;
  phone?: string | null;
  tier: string;
  table: string;
  status: string;
  checkedInOnline: boolean;
  checkedIn: boolean;
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [guests, setGuests] = useState<G[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (k: string) => {
    const res = await fetch("/api/admin", { headers: { "x-admin-key": k } });
    if (!res.ok) return false;
    const data = await res.json();
    setGuests(data.guests);
    return true;
  }, []);

  async function unlock() {
    setBusy(true);
    const ok = await load(key);
    setBusy(false);
    if (ok) setUnlocked(true);
    else setMsg("Wrong admin key.");
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });
    load(key);
  }

  useEffect(() => {
    if (!unlocked) return;
    const id = setInterval(() => load(key), 5000);
    return () => clearInterval(id);
  }, [unlocked, key, load]);

  const inp =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]";

  if (!unlocked) {
    return (
      <main className="min-h-[100svh] bg-[#070707] text-white flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6"
        >
          <ShieldCheck className="h-6 w-6 text-[#d4af37]" />
          <h1 className="mt-3 text-2xl font-[family-name:var(--font-serif)] text-[#e9d69a]">
            Admin Terminal
          </h1>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="Admin key"
            className={`mt-4 ${inp}`}
          />
          {msg && (
            <p className="mt-2 text-sm text-red-400 font-[family-name:var(--font-sans)]">{msg}</p>
          )}
          <button
            onClick={unlock}
            disabled={busy}
            className="mt-4 w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </motion.div>
      </main>
    );
  }

  const pending = guests.filter((g) => g.status === "pending").length;
  const approved = guests.filter((g) => g.status === "approved").length;
  const inCount = guests.filter((g) => g.checkedIn).length;

  return (
    <main className="min-h-[100svh] bg-[#070707] text-white px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
              Admin Terminal
            </p>
            <h1 className="mt-1 text-3xl font-[family-name:var(--font-serif)] text-[#e9d69a]">
              Chioma &amp; Obinna
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60 font-[family-name:var(--font-sans)]">
            <span>
              <Users className="mr-1 inline h-4 w-4 text-[#d4af37]" />
              {guests.length} registered
            </span>
            <span className="text-white/50">{pending} pending</span>
            <span className="text-[#d4af37]">{approved} approved</span>
            <span className="text-emerald-400">{inCount} checked in</span>
            <button onClick={() => load(key)} className="text-[#d4af37]">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-white/8 bg-white/[0.03]">
          <table className="w-full text-left text-sm font-[family-name:var(--font-sans)]">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-widest text-white/40">
                <th className="px-5 py-4">Guest</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Pass ID</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-white/5">
                  <td className="px-5 py-3.5">
                    <span className="font-[family-name:var(--font-serif)] text-base">
                      {g.name}
                    </span>
                    <span className="ml-2 text-xs text-white/35">
                      {g.tier} • {g.table}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white/50">{g.phone || "—"}</td>
                  <td className="px-5 py-3.5 text-white/50 font-mono text-xs">
                    {g.passId}
                  </td>
                  <td className="px-5 py-3.5">
                    {g.checkedIn ? (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                        Checked in
                      </span>
                    ) : g.checkedInOnline ? (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                        Express ready
                      </span>
                    ) : g.status === "declined" ? (
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-400">
                        Declined
                      </span>
                    ) : g.status === "approved" ? (
                      <span className="rounded-full bg-[#d4af37]/15 px-3 py-1 text-xs text-[#d4af37]">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/40">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      {g.status !== "approved" && (
                        <button
                          onClick={() => setStatus(g.id, "approved")}
                          className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400"
                        >
                          Approve
                        </button>
                      )}
                      {g.status !== "declined" && (
                        <button
                          onClick={() => setStatus(g.id, "declined")}
                          className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-400"
                        >
                          Decline
                        </button>
                      )}
                      {g.status === "declined" && (
                        <button
                          onClick={() => setStatus(g.id, "pending")}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
