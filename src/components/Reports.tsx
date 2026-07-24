"use client";

import { useState } from "react";
import { FileDown, Loader2, Check } from "lucide-react";

const REPORTS = [
  { kind: "rsvp", label: "RSVP responses", note: "Everyone who registered, with their answer" },
  { kind: "checkin", label: "Check-in report", note: "Who arrived and at what time" },
  { kind: "seating", label: "Seating chart", note: "Every table and who sits there" },
  { kind: "gifts", label: "Gift record", note: "All gifts with thank-you status" },
];

export default function Reports({ slug, adminKey }: { slug: string; adminKey: string }) {
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState("");

  async function download(kind: string) {
    setBusy(kind);
    const res = await fetch("/api/e/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, adminKey, kind }),
    });
    setBusy("");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDone(kind);
    setTimeout(() => setDone(""), 2200);
  }

  return (
    <div className="sb-surface p-6">
      <div className="flex items-center gap-3">
        <div className="sb-icon sb-icon-gold"><FileDown className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} /></div>
        <div>
          <p className="font-[family-name:var(--font-serif)] text-2xl">Reports</p>
          <p className="text-[11px] text-white/40 font-[family-name:var(--font-sans)]">Download and open in Excel</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <button
            key={r.kind}
            onClick={() => download(r.kind)}
            disabled={busy === r.kind}
            className="sb-ghost group flex items-center justify-between px-5 py-4 text-left"
          >
            <span>
              <span className="block text-[13px] text-white/80 font-[family-name:var(--font-sans)]">{r.label}</span>
              <span className="mt-0.5 block text-[11px] text-white/35 font-[family-name:var(--font-sans)]">{r.note}</span>
            </span>
            {busy === r.kind
              ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#c9a227]" />
              : done === r.kind
              ? <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              : <FileDown className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[#c9a227]" />}
          </button>
        ))}
      </div>
    </div>
  );
}
