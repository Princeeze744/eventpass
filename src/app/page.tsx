"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const headline = "Your Invitation, Reimagined.";

export default function Home() {
  const router = useRouter();
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#070707] text-white flex flex-col items-center justify-center px-5 sm:px-8">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[40vh] w-[90vw] max-w-[700px] rounded-full bg-[#d4af37]/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[25vh] w-[60vw] max-w-[400px] rounded-full bg-[#8a6d1f]/10 blur-[90px]" />
      </div>

      {/* Floating gold particles */}
      {[...Array(14)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#d4af37]/60"
          style={{ left: `${(i * 7.3) % 100}%`, top: `${(i * 13.7) % 100}%` }}
          animate={{ y: [-10, -60], opacity: [0, 0.8, 0] }}
          transition={{
            duration: 6 + (i % 5),
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-6 sm:mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
      >
        <Sparkles className="h-4 w-4 text-[#d4af37]" />
        <span className="text-xs sm:text-sm tracking-widest uppercase text-white/70 font-[family-name:var(--font-sans)]">
          EventPass
        </span>
      </motion.div>

      {/* Headline — letter by letter */}
      <h1 className="max-w-4xl text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[family-name:var(--font-serif)] font-medium leading-tight">
        {headline.split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.03 }}
            className={char === "R" ? "text-[#d4af37]" : ""}
          >
            {char}
          </motion.span>
        ))}
      </h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
        className="mt-5 sm:mt-6 max-w-xl text-center text-base sm:text-lg text-white/60 font-[family-name:var(--font-sans)]"
      >
        Verified digital passes for weddings and events. No queues. No
        gatecrashers. Just elegance at the door.
      </motion.p>

      {/* CTA button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push("/pass/EP-2026-000148")}
        className="group mt-8 sm:mt-10 flex min-h-[52px] items-center gap-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912e] px-8 py-4 text-black font-semibold font-[family-name:var(--font-sans)] shadow-[0_0_40px_rgba(212,175,55,0.35)]"
      >
        View Your Pass
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </motion.button>

      {/* Bottom hint */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-6 sm:bottom-8 px-4 text-center text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/30 font-[family-name:var(--font-sans)]"
      >
        Crafted for unforgettable moments
      </motion.span>
    </main>
  );
}


