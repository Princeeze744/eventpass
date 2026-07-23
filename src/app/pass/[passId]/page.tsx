"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Keyboard, ScanLine, ShieldCheck } from "lucide-react";

type Result = {
  status: "valid" | "invalid" | "duplicate" | "pending";
  message: string;
  preChecked?: boolean;
  guest?: { name: string; tier: string; table: string; checkedInAt?: string };
};

export default function ScanPage() {
  const [usherKey, setUsherKey] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const busyRef = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setResult(null);
    busyRef.current = false;
  }

  async function verify(passId: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId }),
      });
      const data: Result = await res.json();
      setResult(data);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.status === "valid" ? 80 : [60, 40, 60]);
      }
      // Green = 6s auto-close; problems = 10s. Tap anywhere to dismiss instantly.
      const holdTime = data.status === "valid" ? 6000 : 10000;
      dismissTimer.current = setTimeout(() => dismiss(), holdTime);
    } catch {
      busyRef.current = false;
    }
  }

  useEffect(() => {
    if (!gateOpen || manualMode) return;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 12, qrbox: { width: 230, height: 230 } },
          (text: string) => verify(text),
          () => {}
        );
      } catch {
        if (!cancelled) setCameraError(true);
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [gateOpen, manualMode]);

  const theme =
    result?.status === "valid"
      ? { bg: "bg-emerald-600", icon: CheckCircle2, title: result.preChecked ? "EXPRESS ✓ WELCOME" : "WELCOME" }
      : result?.status === "duplicate"
      ? { bg: "bg-amber-500", icon: AlertTriangle, title: "ALREADY USED" }
      : result?.status === "pending"
      ? { bg: "bg-slate-600", icon: AlertTriangle, title: "PENDING — NOT APPROVED" }
      : { bg: "bg-red-600", icon: XCircle, title: "NOT ON LIST" };

  if (!gateOpen) {
    return (
      <main className="min-h-[100svh] bg-[#070707] text-white flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-[340px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6">
          <ShieldCheck className="h-6 w-6 text-[#d4af37]" />
          <p className="mt-3 text-[11px] tracking-[0.3em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
            Usher Access
          </p>
          <input
            type="password"
            value={usherKey}
            onChange={(e) => setUsherKey(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              usherKey === process.env.NEXT_PUBLIC_USHER_KEY &&
              setGateOpen(true)
            }
            placeholder="Usher key"
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]"
          />
          <button
            onClick={() =>
              usherKey === process.env.NEXT_PUBLIC_USHER_KEY && setGateOpen(true)
            }
            className="mt-4 w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)]"
          >
            Open Scanner
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-[#070707] text-white flex flex-col items-center justify-center px-5 overflow-hidden">
      <p className="mb-4 text-[11px] tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
        Entrance Scanner
      </p>

      {!manualMode && (
        <div className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-[#d4af37]/30">
          <div id="reader" className="w-full [&_video]:w-full [&_video]:rounded-3xl" />
          {!cameraError && (
            <motion.div
              animate={{ y: [10, 250, 10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute left-6 right-6 h-0.5 bg-[#d4af37]/80 shadow-[0_0_20px_rgba(212,175,55,0.8)]"
            />
          )}
          {cameraError && (
            <div className="p-8 text-center text-sm text-white/50 font-[family-name:var(--font-sans)]">
              Camera unavailable. Use manual entry below.
            </div>
          )}
        </div>
      )}

      {manualMode && (
        <div className="w-full max-w-[340px] rounded-3xl border border-[#d4af37]/30 bg-white/[0.03] p-6">
          <label className="text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
            Enter Pass ID
          </label>
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && manualId && verify(manualId)}
            placeholder="EP-2026-000148"
            autoFocus
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg tracking-wider outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]"
          />
          <button
            onClick={() => manualId && verify(manualId)}
            className="mt-4 w-full min-h-[52px] rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)]"
          >
            Verify Guest
          </button>
        </div>
      )}

      <button
        onClick={() => setManualMode(!manualMode)}
        className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 font-[family-name:var(--font-sans)]"
      >
        {manualMode ? <ScanLine className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
        {manualMode ? "Switch to Camera" : "Manual Entry"}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer ${theme.bg}`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
            >
              <theme.icon className="h-28 w-28" strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 text-3xl sm:text-4xl font-bold tracking-widest text-center px-4 font-[family-name:var(--font-sans)]"
            >
              {theme.title}
            </motion.h1>
            {result.guest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 text-center font-[family-name:var(--font-sans)]"
              >
                <p className="text-2xl font-[family-name:var(--font-serif)]">
                  {result.guest.name}
                </p>
                <p className="mt-1 text-white/85">
                  {result.guest.tier} • {result.guest.table}
                </p>
                {result.guest.checkedInAt && (
                  <p className="mt-2 text-sm text-white/70">
                    First scanned at {result.guest.checkedInAt}
                  </p>
                )}
              </motion.div>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-10 text-xs tracking-[0.25em] uppercase text-white/60 font-[family-name:var(--font-sans)]"
            >
              Tap anywhere for next guest
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}