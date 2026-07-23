"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5 sm:px-8">
      {/* Ambient glow — green + gold, the Story Box blend */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[700px] rounded-full bg-emerald-700/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-[25vh] w-[60vw] max-w-[400px] rounded-full bg-[#d4af37]/8 blur-[90px]" />
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          className={`absolute h-1 w-1 rounded-full ${i % 2 ? "bg-[#d4af37]/50" : "bg-emerald-500/40"}`}
          style={{ left: `${(i * 8.3) % 100}%`, top: `${(i * 14.7) % 100}%` }}
          animate={{ y: [-10, -60], opacity: [0, 0.8, 0] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
        />
      ))}

      {/* Logo — soft entrance with breathing glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 -m-8 rounded-full bg-emerald-600/20 blur-3xl"
        />
        <Image
          src="/brand/logo-mark.jpg"
          alt="Story Box"
          width={130}
          height={130}
          priority
          className="relative rounded-2xl"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.2em" }}
        animate={{ opacity: 1, letterSpacing: "0.45em" }}
        transition={{ duration: 1.2, delay: 0.6 }}
        className="mt-6 text-sm sm:text-base uppercase text-[#c9a227] font-[family-name:var(--font-sans)]"
      >
        Story Box
      </motion.p>

      {/* Event headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, delay: 1 }}
        className="mt-8 max-w-3xl text-center text-4xl sm:text-5xl md:text-6xl font-[family-name:var(--font-serif)] font-medium leading-tight"
      >
        Chioma <span className="text-[#d4af37]">&amp;</span> Obinna
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="mt-4 max-w-xl text-center text-base sm:text-lg text-white/55 font-[family-name:var(--font-sans)]"
      >
        Sat, Dec 19, 2026 • Aztech Arcum Event Center, Port Harcourt
      </motion.p>

      {/* The two doors */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.9 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/rsvp")}
          className="group flex min-h-[52px] w-[240px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912e] px-8 text-black font-semibold font-[family-name:var(--font-sans)] shadow-[0_0_40px_rgba(212,175,55,0.3)]"
        >
          Register for the Wedding
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/mypass")}
          className="flex min-h-[52px] w-[240px] items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 text-white/85 font-semibold font-[family-name:var(--font-sans)] backdrop-blur-md"
        >
          <KeyRound className="h-4 w-4 text-[#d4af37]" />
          View My Pass
        </motion.button>
      </div>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8 }}
        className="absolute bottom-6 sm:bottom-8 px-4 text-center text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/25 font-[family-name:var(--font-sans)]"
      >
        A Story Box Experience
      </motion.span>
    </main>
  );
}
