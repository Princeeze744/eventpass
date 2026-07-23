"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import BackHome from "@/components/BackHome";

export default function MyPassPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/mypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
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
      <BackHome />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[650px] rounded-full bg-[#d4af37]/10 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
      >
        <KeyRound className="h-4 w-4 text-[#d4af37]" />
        <span className="text-xs tracking-widest uppercase text-white/70 font-[family-name:var(--font-sans)]">
          My Pass
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-center text-4xl sm:text-5xl font-[family-name:var(--font-serif)] text-[#e9d69a]"
      >
        Check Your Status
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 max-w-sm text-center text-sm text-white/50 font-[family-name:var(--font-sans)]"
      >
        Enter the phone number you registered with to view your pass and
        approval status.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="mt-8 w-full max-w-[380px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6 backdrop-blur-sm"
      >
        <label className="text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]">
          Phone Number
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0803 123 4567"
          inputMode="tel"
          autoFocus
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
              View My Pass
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-center text-xs text-white/35 font-[family-name:var(--font-sans)]">
          Haven&apos;t registered?{" "}
          <a href="/rsvp" className="text-[#d4af37] underline-offset-2 hover:underline">
            Register here
          </a>
        </p>
      </motion.div>
    </main>
  );
}
