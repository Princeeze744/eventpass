"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, LayoutGrid, ShieldCheck, Trash2 } from "lucide-react";

export default function AccountMenu({
  name, role, level,
}: { name: string; role: string; level?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5 backdrop-blur-md">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9a227] text-[11px] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">{initials}</span>
        <span className="hidden text-[11px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)] sm:block">{name.split(" ")[0]}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d0c0b] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="border-b border-white/[0.07] px-5 py-4">
              <p className="font-[family-name:var(--font-serif)] text-lg text-[#f5f1ea]">{name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">
                {level && level !== "none" ? `${level} · ${role}` : role}
              </p>
            </div>

            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[12px] text-white/65 transition-colors hover:bg-white/[0.04] font-[family-name:var(--font-sans)]">
              <LayoutGrid className="h-3.5 w-3.5 text-[#c9a227]" /> My console
            </Link>

            <Link href="/dashboard/trash" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[12px] text-white/65 transition-colors hover:bg-white/[0.04] font-[family-name:var(--font-sans)]">
              <Trash2 className="h-3.5 w-3.5 text-[#c9a227]" /> Trash
            </Link>

            {level && level !== "none" && (
              <Link href="/staff" onClick={() => setOpen(false)} className="flex items-center gap-3 border-t border-white/[0.07] px-5 py-3 text-[12px] text-[#c9a227] transition-colors hover:bg-[#c9a227]/[0.07] font-[family-name:var(--font-sans)]">
                <ShieldCheck className="h-3.5 w-3.5" /> Story Box Control
              </Link>
            )}

            <button onClick={signOut} className="flex w-full items-center gap-3 border-t border-white/[0.07] px-5 py-3 text-left text-[12px] text-white/65 transition-colors hover:bg-white/[0.04] font-[family-name:var(--font-sans)]">
              <LogOut className="h-3.5 w-3.5 text-white/40" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
