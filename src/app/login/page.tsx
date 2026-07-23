"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

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

  const inp =
    "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]";
  const lbl =
    "text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[650px] rounded-full bg-[#d4af37]/8 blur-[110px]" />
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-[family-name:var(--font-serif)] text-[#e9d69a]"
      >
        Welcome Back
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 w-full max-w-[400px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6"
      >
        <label className={lbl}>Email</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          inputMode="email"
          className={inp}
        />

        <label className={`mt-5 block ${lbl}`}>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={inp}
        />

        {error && (
          <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-6 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign In <ArrowRight className="h-5 w-5" /></>}
        </button>

        <p className="mt-4 text-center text-xs text-white/35 font-[family-name:var(--font-sans)]">
          New to Story Box?{" "}
          <Link href="/signup" className="text-[#d4af37]">Create an account</Link>
        </p>
      </motion.div>
    </main>
  );
}
