"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const inp = "mt-2 w-full sb-input px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-12">
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
        <filter id="gl"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" /></filter>
        <rect width="100%" height="100%" filter="url(#gl)" />
      </svg>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/3 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-mark.jpg" alt="Story Box" width={32} height={32} className="rounded-lg" />
          <span className="text-[10px] sb-eyebrow text-white/60 font-[family-name:var(--font-sans)]">Story&nbsp;Box</span>
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-8 font-[family-name:var(--font-serif)] text-5xl sb-display leading-[1]">
          Welcome <span className="italic text-[#c9a227]">back.</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-7 sb-surface p-6 backdrop-blur-sm">
          <label className={lbl}>Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" inputMode="email" className={inp} />

          <label className={`mt-5 block ${lbl}`}>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} className={inp} />

          {error && <p className="mt-4 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

          <button onClick={submit} disabled={loading} className="mt-7 flex w-full min-h-[54px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign In <ArrowUpRight className="h-4 w-4" /></>}
          </button>

          <p className="mt-5 text-center text-[11px] text-white/35 font-[family-name:var(--font-sans)]">
            New to Story Box? <Link href="/signup" className="text-[#c9a227]">Create an account</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
