"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxCover({ src, children }: { src: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-[100svh] overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/70 via-[#080807]/45 to-[#080807]" />
      </motion.div>
      <motion.div style={{ opacity: fade }} className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
        {children}
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.35em] text-white/60 font-[family-name:var(--font-sans)]"
      >
        Scroll
      </motion.div>
    </div>
  );
}

export function Gallery({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    function key(ev: KeyboardEvent) {
      if (open === null) return;
      if (ev.key === "Escape") setOpen(null);
      if (ev.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % urls.length));
      if (ev.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + urls.length) % urls.length));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, urls.length]);

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((u, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: (i % 6) * 0.07 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.07]"
          >
            <img src={u} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080807]/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 px-4"
            onClick={() => setOpen(null)}
          >
            <button className="absolute right-5 top-5 rounded-full border border-white/20 p-2.5 text-white/70"><X className="h-5 w-5" /></button>
            <button onClick={(ev) => { ev.stopPropagation(); setOpen((i) => (i === null ? null : (i - 1 + urls.length) % urls.length)); }} className="absolute left-4 rounded-full border border-white/20 p-3 text-white/70"><ChevronLeft className="h-5 w-5" /></button>
            <motion.img
              key={open}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              src={urls[open]}
              alt=""
              onClick={(ev) => ev.stopPropagation()}
              className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain"
            />
            <button onClick={(ev) => { ev.stopPropagation(); setOpen((i) => (i === null ? null : (i + 1) % urls.length)); }} className="absolute right-4 rounded-full border border-white/20 p-3 text-white/70"><ChevronRight className="h-5 w-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function StickyNav({ title, slug }: { title: string; slug: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-[#080807]/85 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-[1000px] items-center justify-between px-5 py-3.5 sm:px-8">
            <span className="font-[family-name:var(--font-serif)] text-xl text-[#f5f1ea]">{title}</span>
            <a href={`/e/${slug}/rsvp`} className="rounded-full bg-[#f5f1ea] px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Get Pass</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
