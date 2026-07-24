"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Download, Loader2, X } from "lucide-react";

export default function ImportPanel({
  slug, adminKey, onDone,
}: {
  slug: string; adminKey: string; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function importList() {
    if (!list.trim() || busy) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/e/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey, list, autoApprove }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Import failed.");
      return;
    }
    setMsg(`Added ${data.added} guests · ${data.skipped} skipped`);
    setList("");
    onDone();
  }

  async function handleFile(f: File) {
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    setList(lines.join("\n"));
    setOpen(true);
  }

  async function exportCsv() {
    const res = await fetch("/api/e/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-guests.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const btn = "flex items-center gap-2 sb-ghost px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setOpen(true)} className={btn}>
          <UploadCloud className="h-3.5 w-3.5 text-[#c9a227]" /> Import guests
        </button>
        <label className={`${btn} cursor-pointer`}>
          <UploadCloud className="h-3.5 w-3.5 text-[#c9a227]" /> Upload CSV
          <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <button onClick={exportCsv} className={btn}>
          <Download className="h-3.5 w-3.5 text-[#c9a227]" /> Export list
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-[560px] sb-panel p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">Import guests</h3>
                  <p className="mt-2 text-[12px] text-white/45 font-[family-name:var(--font-sans)]">
                    One guest per line: <span className="text-white/70">Name, Phone, Category, Party size</span>
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full border border-white/10 p-2 text-white/50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={list}
                onChange={(e) => setList(e.target.value)}
                rows={9}
                placeholder={"Amara Johnson, 08031234567, VIP, 2\nEmeka Eze, 07069876543, Family\nFatima Bello, 08155551234\nChidi Okonkwo"}
                className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-[12px] text-[#f5f1ea] outline-none focus:border-[#c9a227]/60"
              />

              <label className="mt-4 flex items-center gap-3 text-[12px] text-white/60 font-[family-name:var(--font-sans)]">
                <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} className="h-4 w-4 accent-[#c9a227]" />
                Approve these guests immediately
              </label>

              {msg && <p className="mt-4 text-[12px] text-[#c9a227] font-[family-name:var(--font-sans)]">{msg}</p>}

              <div className="mt-6 flex gap-3">
                <button onClick={importList} disabled={busy} className="flex min-h-[48px] flex-1 items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
                </button>
                <button onClick={() => setOpen(false)} className="sb-ghost px-6 text-[11px] uppercase tracking-[0.2em] text-white/60 font-[family-name:var(--font-sans)]">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
