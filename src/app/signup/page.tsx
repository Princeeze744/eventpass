"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

const ROLES = [
  { id: "planner", label: "Planner" },
  { id: "host", label: "Host" },
  { id: "guest", label: "Guest" },
  { id: "vendor", label: "Vendor" },
];

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("role") || "planner";

  const [role, setRole] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
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

  const inp = "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 outline-none focus:border-[#d4af37]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[11px] tracking-[0.25em] uppercase text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[650px] rounded-full bg-emerald-700/10 blur-[110px]" />
      </div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-[family-name:var(--font-serif)] text-[#e9d69a]">Create Your Account</motion.h1>
      <p className="mt-2 text-sm text-white/50 font-[family-name:var(--font-sans)]">Join Story Box</p>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 w-full max-w-[420px] rounded-3xl border border-[#d4af37]/25 bg-white/[0.03] p-6">
        <p className={lbl}>I am joining as</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-[family-name:var(--font-sans)] ${role === r.id ? "border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]" : "border-white/10 bg-black/30 text-white/50"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className={`mt-6 block ${lbl}`}>Full Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prince Ochidi" className={inp} />

        <label className={`mt-5 block ${lbl}`}>Email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" inputMode="email" className={inp} />

        <label className={`mt-5 block ${lbl}`}>Phone (optional)</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0803 123 4567" inputMode="tel" className={inp} />

        <label className={`mt-5 block ${lbl}`}>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="At least 8 characters" className={inp} />

        {error && <p className="mt-3 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

        <button onClick={submit} disabled={loading} className="mt-6 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8912e] font-semibold text-black font-[family-name:var(--font-sans)] disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="h-5 w-5" /></>}
        </button>

        <p className="mt-4 text-center text-xs text-white/35 font-[family-name:var(--font-sans)]">
          Already have an account? <Link href="/login" className="text-[#d4af37]">Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[100svh] bg-[#070707]" />}>
      <SignupInner />
    </Suspense>
  );
}
