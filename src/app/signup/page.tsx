"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";

const ROLES = [
  { id: "planner", label: "Planner" },
  { id: "host", label: "Host" },
  { id: "guest", label: "Guest" },
  { id: "vendor", label: "Vendor" },
];

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "planner");
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

  const inp = "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-12">
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
        <filter id="gs"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" /></filter>
        <rect width="100%" height="100%" filter="url(#gs)" />
      </svg>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[45vw] rounded-full bg-[#c9a227]/[0.07] blur-[110px]" />
      </div>

      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-mark.jpg" alt="Story Box" width={32} height={32} className="rounded-lg" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-[family-name:var(--font-sans)]">Story&nbsp;Box</span>
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-8 font-[family-name:var(--font-serif)] text-5xl leading-[1]">
          Create your <span className="italic text-[#c9a227]">account.</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-7 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm">
          <p className={lbl}>I am joining as</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {ROLES.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className={`rounded-xl border py-2.5 text-[11px] font-[family-name:var(--font-sans)] ${role === r.id ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/45"}`}>
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

          {error && <p className="mt-4 text-sm text-red-400 font-[family-name:var(--font-sans)]">{error}</p>}

          <button onClick={submit} disabled={loading} className="mt-7 flex w-full min-h-[54px] items-center justify-center gap-2 rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)] disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowUpRight className="h-4 w-4" /></>}
          </button>

          <p className="mt-5 text-center text-[11px] text-white/35 font-[family-name:var(--font-sans)]">
            Already have an account? <Link href="/login" className="text-[#c9a227]">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[100svh] bg-[#080807]" />}>
      <SignupInner />
    </Suspense>
  );
}
