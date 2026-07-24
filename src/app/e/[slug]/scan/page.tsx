"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Keyboard, ScanLine, ShieldCheck, Check } from "lucide-react";

type Result = {
  status: "valid" | "invalid" | "duplicate" | "pending";
  message: string;
  preChecked?: boolean;
  guest?: { name: string; tier: string; table: string; partySize?: number; checkedInAt?: string };
};

export default function EventScanner() {
  const params = useParams();
  const slug = String(params.slug);

  const [usherKey, setUsherKey] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [tableInput, setTableInput] = useState("");
  const [tableSaved, setTableSaved] = useState(false);

  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPass = useRef("");

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResult(null);
    setTableInput("");
    setTableSaved(false);
    busyRef.current = false;
  }

  async function verify(passId: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    lastPass.current = passId.trim();
    try {
      const res = await fetch("/api/e/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, passId, usherKey }),
      });
      const data: Result = await res.json();
      setResult(data);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(data.status === "valid" ? 80 : [60, 40, 60]);
      }
      timerRef.current = setTimeout(dismiss, data.status === "valid" ? 12000 : 10000);
    } catch {
      busyRef.current = false;
    }
  }

  async function assignTable() {
    if (!tableInput.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    await fetch("/api/e/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, passId: lastPass.current, table: tableInput, usherKey }),
    });
    setTableSaved(true);
    timerRef.current = setTimeout(dismiss, 2500);
  }

  async function openGate() {
    const res = await fetch("/api/e/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, passId: "___probe___", usherKey }),
    });
    if (res.status === 401) {
      setKeyError("Wrong usher key.");
      return;
    }
    setKeyError("");
    setGateOpen(true);
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
      ? { bg: "bg-emerald-600", Icon: CheckCircle2, title: result.preChecked ? "EXPRESS ✓ WELCOME" : "WELCOME" }
      : result?.status === "duplicate"
      ? { bg: "bg-amber-500", Icon: AlertTriangle, title: "ALREADY USED" }
      : result?.status === "pending"
      ? { bg: "bg-slate-600", Icon: AlertTriangle, title: "NOT APPROVED" }
      : { bg: "bg-red-600", Icon: XCircle, title: "NOT ON LIST" };

  if (!gateOpen) {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-[360px] rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6">
          <ShieldCheck className="h-5 w-5 text-[#c9a227]" strokeWidth={1.6} />
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Usher Access</p>
          <input
            type="password"
            value={usherKey}
            onChange={(e) => setUsherKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openGate()}
            placeholder="GATE-XXXXXX"
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 uppercase tracking-widest text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />
          {keyError && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{keyError}</p>}
          <button onClick={openGate} className="mt-4 w-full min-h-[50px] rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
            Open Scanner
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 overflow-hidden">
      <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-white/35 font-[family-name:var(--font-sans)]">Entrance Scanner</p>

      {!manualMode && (
        <div className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-[#c9a227]/30">
          <div id="reader" className="w-full [&_video]:w-full [&_video]:rounded-3xl" />
          {!cameraError && (
            <motion.div animate={{ y: [10, 250, 10] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute left-6 right-6 h-0.5 bg-[#c9a227]/80 shadow-[0_0_20px_rgba(201,162,39,0.8)]" />
          )}
          {cameraError && (
            <div className="p-8 text-center text-sm text-white/45 font-[family-name:var(--font-sans)]">Camera unavailable. Use manual entry.</div>
          )}
        </div>
      )}

      {manualMode && (
        <div className="w-full max-w-[340px] rounded-3xl border border-[#c9a227]/30 bg-white/[0.025] p-6">
          <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">Enter Pass ID</label>
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && manualId && verify(manualId)}
            placeholder="SB-XXXXXX"
            autoFocus
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg uppercase tracking-wider text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />
          <button onClick={() => manualId && verify(manualId)} className="mt-4 w-full min-h-[50px] rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
            Verify Guest
          </button>
        </div>
      )}

      <button onClick={() => setManualMode(!manualMode)} className="mt-6 flex items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/60 font-[family-name:var(--font-sans)]">
        {manualMode ? <ScanLine className="h-3.5 w-3.5" /> : <Keyboard className="h-3.5 w-3.5" />}
        {manualMode ? "Camera" : "Manual"}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 ${theme.bg}`}
          >
            <motion.div initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
              <theme.Icon className="h-24 w-24" strokeWidth={1.5} />
            </motion.div>
            <h1 className="mt-5 text-center text-3xl font-bold tracking-widest sm:text-4xl font-[family-name:var(--font-sans)]">{theme.title}</h1>

            {result.guest && (
              <div className="mt-3 text-center font-[family-name:var(--font-sans)]">
                <p className="font-[family-name:var(--font-serif)] text-2xl">{result.guest.name}</p>
                <p className="mt-1 text-white/85">
                  {result.guest.tier}
                  {result.guest.partySize && result.guest.partySize > 1 ? ` · Party of ${result.guest.partySize}` : ""}
                </p>
                {result.guest.checkedInAt && <p className="mt-2 text-sm text-white/70">First scanned at {result.guest.checkedInAt}</p>}
              </div>
            )}

            {result.status === "valid" && (
              <div className="mt-6 w-full max-w-[300px]">
                {tableSaved ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-black/25 px-4 py-3 font-[family-name:var(--font-sans)]">
                    <Check className="h-5 w-5" /> <span className="font-semibold">Seated at {tableInput}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/80 font-[family-name:var(--font-sans)]">Assign Table</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={tableInput}
                        onChange={(e) => setTableInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && assignTable()}
                        placeholder="Table 12"
                        className="flex-1 rounded-xl border border-white/30 bg-black/25 px-4 py-3 text-white placeholder-white/50 outline-none focus:border-white font-[family-name:var(--font-sans)]"
                      />
                      <button onClick={assignTable} className="rounded-xl bg-black/40 px-5 font-semibold text-white font-[family-name:var(--font-sans)]">Save</button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={dismiss} className="absolute bottom-8 rounded-full border border-white/40 px-7 py-2.5 text-[10px] uppercase tracking-[0.25em] text-white/90 font-[family-name:var(--font-sans)]">
              Next Guest
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}