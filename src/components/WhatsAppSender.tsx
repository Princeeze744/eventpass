"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Loader2,
  Check,
  CheckCheck,
  Eye,
  AlertTriangle,
  Send,
  PhoneOff,
} from "lucide-react";

type Status = {
  total: number;
  configured: boolean;
  template: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  noPhone: number;
  error?: string;
};

type SendResult = {
  sent: number;
  failed: number;
  remaining: number;
  done?: boolean;
  capReached?: boolean;
  headroom?: number;
  sentLast24h?: number;
  message?: string;
  fatal?: string | null;
  errors?: { name: string; phone: string; error: string }[];
  error?: string;
};

export default function WhatsAppSender({
  slug,
  adminKey,
}: {
  slug: string;
  adminKey: string;
}) {
  const [st, setSt] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [fails, setFails] = useState<{ name: string; phone: string; error: string }[]>([]);
  const stop = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/e/whatsapp/send?slug=${encodeURIComponent(slug)}&key=${encodeURIComponent(adminKey)}`
      );
      const j = (await r.json()) as Status;
      setSt(j);
    } catch {
      /* leave previous state */
    }
  }, [slug, adminKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* keep the ticks moving while the webhook reports back */
  useEffect(() => {
    if (running) return;
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [running, refresh]);

  async function run() {
    setConfirming(false);
    setRunning(true);
    setFails([]);
    setNote("Starting…");
    stop.current = false;

    let guard = 0;

    while (!stop.current && guard < 60) {
      guard++;
      let j: SendResult;
      try {
        const r = await fetch("/api/e/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, key: adminKey }),
        });
        j = (await r.json()) as SendResult;
      } catch {
        setNote("Lost connection. Nothing was lost - press send again to continue.");
        break;
      }

      if (j.error) {
        setNote(j.error);
        break;
      }

      if (j.errors?.length) {
        setFails((prev) => [...prev, ...j.errors!].slice(0, 50));
      }

      await refresh();

      if (j.fatal) {
        setNote(`Stopped: ${j.fatal}`);
        break;
      }

      if (j.capReached) {
        setNote(
          j.message ||
            "Daily limit of 250 reached. The rest can go out once 24 hours have passed."
        );
        break;
      }

      if (j.done || j.remaining <= 0) {
        setNote("All invitations sent.");
        break;
      }

      if (j.sent === 0 && j.failed === 0) {
        setNote("Nothing left to send.");
        break;
      }

      setNote(`${j.remaining} remaining…`);
    }

    setRunning(false);
    refresh();
  }

  const card = "sb-surface sb-lift";

  if (!st) {
    return (
      <div className={`${card} p-6`}>
        <Loader2 className="h-4 w-4 animate-spin text-[#c9a227]" />
      </div>
    );
  }

  if (st.error) {
    return (
      <div className={`${card} p-6`}>
        <p className="text-[12px] text-red-400 font-[family-name:var(--font-sans)]">
          {st.error}
        </p>
      </div>
    );
  }

  const reachable = st.total - st.noPhone;
  const doneCount = st.sent + st.delivered + st.read;
  const pct = reachable > 0 ? Math.round((doneCount / reachable) * 100) : 0;

  const tiles = [
    { n: st.pending, l: "Not sent", Icon: Send, tone: "text-white/60" },
    { n: st.sent, l: "Sent", Icon: Check, tone: "text-[#c9a227]" },
    { n: st.delivered, l: "Delivered", Icon: CheckCheck, tone: "text-[#c9a227]" },
    { n: st.read, l: "Read", Icon: Eye, tone: "text-emerald-400" },
  ];

  return (
    <div className={`${card} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">
            WhatsApp invitations
          </p>
        </div>
        {!st.configured && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-amber-400 font-[family-name:var(--font-sans)]">
            Not connected
          </span>
        )}
      </div>

      {/* progress */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className="font-[family-name:var(--font-serif)] text-3xl sb-display">
            {doneCount}
            <span className="text-white/25"> / {reachable}</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">
            {pct}% delivered
          </p>
        </div>
        <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-[#c9a227]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* tiles */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.l}
            className="rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3"
          >
            <t.Icon className={`h-3.5 w-3.5 ${t.tone}`} strokeWidth={1.8} />
            <p className="mt-2 font-[family-name:var(--font-serif)] text-2xl">{t.n}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/35 font-[family-name:var(--font-sans)]">
              {t.l}
            </p>
          </div>
        ))}
      </div>

      {(st.failed > 0 || st.noPhone > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {st.failed > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/[0.07] px-3 py-1.5 text-[11px] text-red-300 font-[family-name:var(--font-sans)]">
              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
              {st.failed} failed
            </span>
          )}
          {st.noPhone > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/45 font-[family-name:var(--font-sans)]">
              <PhoneOff className="h-3 w-3" strokeWidth={2} />
              {st.noPhone} without a usable number
            </span>
          )}
        </div>
      )}

      {/* action */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/[0.06] p-5"
            >
              <p className="font-[family-name:var(--font-serif)] text-xl">
                Send {st.pending} invitation{st.pending === 1 ? "" : "s"}?
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                Each guest receives their own card with their name and QR code. This
                cannot be undone, and WhatsApp charges per message. Guests already
                sent to will be skipped.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={run}
                  className="min-h-[46px] flex-1 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]"
                >
                  Yes, send now
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="min-h-[46px] flex-1 sb-ghost text-[11px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="send"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(true)}
              disabled={running || !st.configured || st.pending === 0}
              className="w-full min-h-[50px] sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-35"
            >
              {running ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : st.pending === 0 ? (
                "Everyone has been sent their invitation"
              ) : (
                `Send invitations on WhatsApp (${st.pending})`
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {running && (
          <button
            onClick={() => {
              stop.current = true;
              setNote("Stopping after this batch…");
            }}
            className="mt-2 w-full sb-ghost py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]"
          >
            Stop
          </button>
        )}

        {note && (
          <p className="mt-3 text-center text-[12px] text-white/50 font-[family-name:var(--font-sans)]">
            {note}
          </p>
        )}

        {!st.configured && (
          <p className="mt-3 text-center text-[11px] text-amber-400/80 font-[family-name:var(--font-sans)]">
            WhatsApp is not connected for this site yet.
          </p>
        )}
      </div>

      {/* failures */}
      {fails.length > 0 && (
        <div className="mt-5 rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-300/80 font-[family-name:var(--font-sans)]">
            Could not deliver
          </p>
          <div className="mt-3 max-h-[220px] space-y-1.5 overflow-y-auto">
            {fails.map((f, i) => (
              <div key={i} className="text-[12px] font-[family-name:var(--font-sans)]">
                <span className="text-white/70">{f.name}</span>
                <span className="text-white/25"> · {f.phone} · </span>
                <span className="text-red-300/70">{f.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
