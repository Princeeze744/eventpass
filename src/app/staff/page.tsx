"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Calendar, Users, Ticket, Wallet, Check, X, Pause, ExternalLink, UserPlus, Crown, ArrowLeft } from "lucide-react";

type Ev = {
  id: string; slug: string; title: string; eventDate: string; venue: string;
  approval: string; reviewNote: string | null; approvedBy: string | null;
  paymentStatus: string; paymentAmount: number | null; guests: number;
  owner: { name: string; email: string; phone: string | null; role: string };
};

type Usr = {
  id: string; name: string; email: string; role: string;
  isStaff: boolean; level: string; suspended: boolean; invitedBy: string | null;
};

type Data = {
  me: { name: string; email: string; level: string };
  totals: { events: number; pending: number; approved: number; planners: number; users: number; guests: number; revenue: number; staff: number };
  events: Ev[];
  users: Usr[];
};

export default function StaffPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<"events" | "planners" | "team">("events");
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [review, setReview] = useState<Ev | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLevel, setInviteLevel] = useState("reviewer");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/overview");
    if (res.status === 401) { setDenied(true); setLoading(false); return; }
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Something went wrong."); return; }
    if (d.name) setMsg(`${d.name} is now ${d.level === "none" ? "removed from the team" : d.level}.`);
    setReview(null); setNote(""); setAmount(""); setInviteEmail("");
    load();
  }

  const card = "sb-surface sb-lift";
  const inp = "w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const isOwner = data?.me.level === "owner";
  const isAdmin = isOwner || data?.me.level === "admin";

  if (loading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#080807]"><Loader2 className="h-6 w-6 animate-spin text-[#c9a227]" /></main>;

  if (denied) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center bg-[#080807] px-6 text-center text-[#f5f1ea]">
        <ShieldCheck className="h-6 w-6 text-white/25" strokeWidth={1.6} />
        <h1 className="mt-4 font-[family-name:var(--font-serif)] text-4xl sb-display">Staff only</h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">You do not have access to this area.</p>
        <Link href="/dashboard" className="mt-6 sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Back to console</Link>
      </main>
    );
  }

  const events = (data?.events || []).filter((e) => filter === "all" || e.approval === filter);
  const planners = (data?.users || []).filter((u) => u.role === "planner" || u.role === "host");
  const team = (data?.users || []).filter((u) => u.level !== "none");

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-8 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">
              <ArrowLeft className="h-3.5 w-3.5" /> My console
            </Link>
            <p className="mt-5 text-[10px] sb-eyebrow text-[#c9a227] font-[family-name:var(--font-sans)]">Story Box Control</p>
            <h1 className="mt-2 font-[family-name:var(--font-serif)] text-5xl sb-display">Platform <span className="italic text-[#c9a227]">overview.</span></h1>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-[#c9a227]/30 bg-[#c9a227]/[0.08] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#c9a227] font-[family-name:var(--font-sans)]">
            {isOwner && <Crown className="h-3.5 w-3.5" />} {data?.me.level}
          </span>
        </div>

        <div className="mt-8 grid gap-3 grid-cols-2 lg:grid-cols-6">
          {[
            { k: data?.totals.events ?? 0, v: "Events", Icon: Calendar },
            { k: data?.totals.pending ?? 0, v: "Awaiting review", Icon: ShieldCheck },
            { k: data?.totals.approved ?? 0, v: "Live", Icon: Check },
            { k: data?.totals.planners ?? 0, v: "Planners", Icon: Users },
            { k: data?.totals.guests ?? 0, v: "Guests", Icon: Ticket },
            { k: `N${(data?.totals.revenue ?? 0).toLocaleString()}`, v: "Recorded", Icon: Wallet },
          ].map((t) => (
            <div key={t.v} className={`${card} p-5`}>
              <t.Icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-4 font-[family-name:var(--font-serif)] text-3xl sb-figure">{t.k}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">{t.v}</p>
            </div>
          ))}
        </div>

        {msg && <p className="mt-5 rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.07] px-5 py-3 text-[12px] text-[#c9a227] font-[family-name:var(--font-sans)]">{msg}</p>}

        <div className="mt-8 flex flex-wrap gap-2">
          {(["events", "planners", "team"] as const).map((t) => (
            (t !== "team" || isOwner) && (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-sans)] ${tab === t ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>{t}</button>
            )
          ))}
        </div>

        {tab === "events" && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["pending", "approved", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${filter === f ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>{f}</button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {events.length === 0 && <p className={`${card} p-10 text-center text-[13px] text-white/35 font-[family-name:var(--font-sans)]`}>Nothing here.</p>}

              {events.map((e) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-6`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[#e9d69a]">{e.title}</h3>
                      <p className="mt-1 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">{e.eventDate} · {e.venue} · {e.guests} guests</p>
                      <p className="mt-1 text-[12px] text-white/35 font-[family-name:var(--font-sans)]">{e.owner.name} · {e.owner.email}</p>
                      {e.approvedBy && <p className="mt-1 text-[11px] text-white/25 font-[family-name:var(--font-sans)]">Activated by {e.approvedBy}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)]" style={{
                        color: e.approval === "approved" ? "#34d399" : e.approval === "rejected" ? "#f87171" : e.approval === "suspended" ? "#fbbf24" : "#9ca3af",
                        backgroundColor: e.approval === "approved" ? "#34d39920" : e.approval === "rejected" ? "#f8717120" : e.approval === "suspended" ? "#fbbf2420" : "#ffffff12",
                      }}>{e.approval}</span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-white/35 font-[family-name:var(--font-sans)]">
                        {e.paymentStatus}{e.paymentAmount ? ` · N${e.paymentAmount.toLocaleString()}` : ""}
                      </span>
                    </div>
                  </div>

                  {e.reviewNote && <p className="mt-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-[12px] text-white/50 font-[family-name:var(--font-sans)]">{e.reviewNote}</p>}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {e.approval !== "approved" && (
                      <button onClick={() => act({ action: "review", eventId: e.id, approval: "approved" })} disabled={busy} className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                        <Check className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                    {e.approval === "approved" && (
                      <button onClick={() => act({ action: "review", eventId: e.id, approval: "suspended" })} disabled={busy} className="flex items-center gap-2 rounded-full border border-amber-500/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-amber-400 font-[family-name:var(--font-sans)]">
                        <Pause className="h-3.5 w-3.5" /> Suspend
                      </button>
                    )}
                    <button onClick={() => { setReview(e); setNote(e.reviewNote || ""); setAmount(e.paymentAmount ? String(e.paymentAmount) : ""); }} className="sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Review</button>
                    <a href={`/e/${e.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {tab === "planners" && (
          <div className={`${card} mt-4 overflow-x-auto`}>
            <table className="w-full text-left text-sm font-[family-name:var(--font-sans)]">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.2em] text-white/35">
                  <th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {planners.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] sb-row">
                    <td className="px-5 py-3.5 font-[family-name:var(--font-serif)] text-base">{u.name}</td>
                    <td className="px-5 py-3.5 text-white/45">{u.email}</td>
                    <td className="px-5 py-3.5 text-white/45">{u.role}</td>
                    <td className="px-5 py-3.5">
                      {u.suspended
                        ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-[10px] text-red-400">Suspended</span>
                        : <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">Active</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin && (
                        <button onClick={() => act({ action: "toggleSuspend", userId: u.id })} className="rounded-full border border-red-500/30 px-4 py-1.5 text-[10px] text-red-400">{u.suspended ? "Unsuspend" : "Suspend"}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "team" && isOwner && (
          <>
            <div className={`${card} mt-4 p-6`}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Add someone to the team</p>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
                They must already have a Story Box account. Enter their email and choose what they can do.
                <span className="mt-1 block text-white/35">Admin: activate events, record payments, suspend planners. Reviewer: activate or hold events only.</span>
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="person@example.com" inputMode="email" className={`flex-1 ${inp}`} />
                <div className="flex gap-2">
                  {["reviewer", "admin"].map((l) => (
                    <button key={l} onClick={() => setInviteLevel(l)} className={`rounded-xl border px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)] ${inviteLevel === l ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 text-white/45"}`}>{l}</button>
                  ))}
                  <button onClick={() => act({ action: "setLevel", email: inviteEmail, level: inviteLevel })} disabled={busy || !inviteEmail} className="rounded-xl bg-[#f5f1ea] px-6 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-40">Add</button>
                </div>
              </div>
            </div>

            <div className={`${card} mt-3 overflow-x-auto`}>
              <table className="w-full text-left text-sm font-[family-name:var(--font-sans)]">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.2em] text-white/35">
                    <th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Level</th><th className="px-5 py-4">Added by</th><th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((u) => (
                    <tr key={u.id} className="border-b border-white/[0.04] sb-row">
                      <td className="px-5 py-3.5 font-[family-name:var(--font-serif)] text-base">{u.name}</td>
                      <td className="px-5 py-3.5 text-white/45">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex w-fit items-center gap-1.5 rounded-full bg-[#c9a227]/15 px-3 py-1 text-[10px] uppercase text-[#c9a227]">
                          {u.level === "owner" && <Crown className="h-3 w-3" />}{u.level}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/35 text-[11px]">{u.invitedBy || "—"}</td>
                      <td className="px-5 py-3.5">
                        {u.level !== "owner" && (
                          <div className="flex gap-2">
                            <button onClick={() => act({ action: "setLevel", userId: u.id, level: u.level === "admin" ? "reviewer" : "admin" })} className="sb-ghost px-3 py-1 text-[10px] text-white/55">Make {u.level === "admin" ? "reviewer" : "admin"}</button>
                            <button onClick={() => act({ action: "setLevel", userId: u.id, level: "none" })} className="rounded-full border border-red-500/30 px-3 py-1 text-[10px] text-red-400">Remove</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {review && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-[480px] sb-panel p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">{review.title}</h3>
                <button onClick={() => setReview(null)} className="rounded-full border border-white/10 p-2 text-white/50"><X className="h-4 w-4" /></button>
              </div>

              {isAdmin && (
                <>
                  <label className="mt-5 block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Amount paid</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="150000" className={`mt-2 ${inp}`} />
                  <div className="mt-3 flex gap-2">
                    {["unpaid", "partial", "paid"].map((s) => (
                      <button key={s} onClick={() => act({ action: "payment", eventId: review.id, paymentStatus: s, paymentAmount: amount })} className="flex-1 rounded-xl border border-white/12 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">Mark {s}</button>
                    ))}
                  </div>
                </>
              )}

              <label className="mt-6 block text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Note to planner</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Shown on their event console" className={`mt-2 ${inp} resize-y`} />

              <div className="mt-6 grid grid-cols-3 gap-2">
                <button onClick={() => act({ action: "review", eventId: review.id, approval: "approved", note })} className="rounded-full bg-emerald-500 py-3 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Activate</button>
                <button onClick={() => act({ action: "review", eventId: review.id, approval: "pending", note })} className="sb-ghost py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">Hold</button>
                <button onClick={() => act({ action: "review", eventId: review.id, approval: "rejected", note })} className="rounded-full border border-red-500/40 py-3 text-[10px] uppercase tracking-[0.15em] text-red-400 font-[family-name:var(--font-sans)]">Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
