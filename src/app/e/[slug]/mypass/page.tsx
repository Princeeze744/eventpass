"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function MyPassPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/e/mypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push(`/e/${slug}/pass/${data.passId}`);
  }

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[45vh] w-[80vw] rounded-full bg-[#c9a227]/[0.08] blur-[130px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <Link href={`/e/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Event details
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
          Find your <span className="italic text-[#c9a227]">pass.</span>
        </motion.h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Enter the phone number you registered with.
        </p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-7 sb-surface p-6 backdrop-blur-sm">
          <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="0803 123 4567"
            inputMode="tel"
            autoFocus
            className="mt-2 w-full sb-input px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]"
          />

          {error && <p className="mt-4 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

          <button onClick={submit} disabled={loading} className="mt-6 flex w-full min-h-[54px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>View My Pass <ArrowUpRight className="h-4 w-4" /></>}
          </button>

          <p className="mt-4 text-center text-[11px] text-white/35 font-[family-name:var(--font-sans)]">
            Not registered yet? <Link href={`/e/${slug}/rsvp`} className="text-[#c9a227]">Register here</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}