"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function RsvpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/pass/${data.passId}`);
    } catch {
      setError("Network issue — please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[650px] rounded-full bg-[#d4af37]/10 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
      >
        <Sparkles className="h-4 w-4 text-[#d4af37]" />
        <span className="text-xs tracking-widest uppercase text-white/70 font-[family-name:var(--font-sans)]">
          You Are Invited
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="text-center text-5xl sm:text-6xl font-[family-name:var(--font-serif)] text-[#e9d69a]"
      >
        Chioma &amp; Obinna
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-center text-white/50 font-[family-name:var(--font-sans)] text-sm sm:text-base"
      >
        Sat, Dec 19, 2026 • Aztech Arcum Event Center, Port Harcourt
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mt-10 w-full max-w-[380px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6 backdrop-blur-sm"
      >
        <label className="text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
          Full Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amara Johnson"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]"
        />

        <label className="mt-5 block text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
          Phone (WhatsApp)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803 123 4567"
          inputMode="tel"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]"
        />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={loading}
          className="mt-6 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Reserve My Seat
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-center text-[10px] text-white/30 font-[family-name:var(--font-sans)]">
          Your personal verified pass will be generated instantly
        </p>
        <p className="mt-2 text-center text-xs text-white/35 font-[family-name:var(--font-sans)]">
          Already registered?{" "}
          <a href="/mypass" className="text-[#d4af37] underline-offset-2 hover:underline">
            Check your status
          </a>
        </p>
      </motion.div>
    </main>
  );
}
