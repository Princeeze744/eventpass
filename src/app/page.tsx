"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ShieldCheck, ScanLine, Users, LayoutGrid, Sparkles,
  Send, ClipboardCheck, BadgeCheck, DoorOpen, Plus, Minus,
  UploadCloud, Armchair, Globe, Mail, Image as ImageIcon, Gift,
  Truck, BarChart3, MessageCircle, QrCode, Wallet,
} from "lucide-react";

const reveal = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: 0,
    transition: { duration: 1, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

const journey = [
  {
    icon: Send,
    label: "Invite",
    title: "One link, everyone invited",
    copy: "Share a single registration link on WhatsApp, on the invitation card, anywhere. No app to download, nothing for your guests to install.",
    accent: "#f5f1ea",
    badge: "INVITED",
    state: "Awaiting registration",
  },
  {
    icon: ClipboardCheck,
    label: "Register",
    title: "Guests confirm themselves",
    copy: "They enter their name and number and instantly receive a personal pass. Your guest list builds itself while you sleep.",
    accent: "#9ca3af",
    badge: "PENDING",
    state: "Awaiting host approval",
  },
  {
    icon: BadgeCheck,
    label: "Approve",
    title: "You decide who comes",
    copy: "Review registrations in one console. Decline a stranger and their pass dies instantly — everyone else is approved automatically.",
    accent: "#c9a227",
    badge: "APPROVED",
    state: "Ready for the day",
  },
  {
    icon: DoorOpen,
    label: "Arrive",
    title: "One second at the gate",
    copy: "Ushers scan, the screen flashes green with the name and table, and your guest walks in. Copies and screenshots are caught instantly.",
    accent: "#34d399",
    badge: "CHECKED IN",
    state: "Table 07 · Seat 3",
  },
];

const features = [
  { icon: UploadCloud, t: "Guest Management", c: "Import from Excel, categorise as family, friends, VIP or vendor, and export anytime." },
  { icon: QrCode, t: "Verified Passes", c: "Unique, single-use passes that cannot be forwarded, copied or reused." },
  { icon: ScanLine, t: "Gate Control", c: "Camera scanning with manual backup, built to keep moving when the venue network does not." },
  { icon: Armchair, t: "Seating Plan", c: "Sections, tables and seats — assigned in advance or at the door as guests arrive." },
  { icon: Globe, t: "Event Website", c: "Story, dress code, colours, hotels, directions, livestream and gallery in one place." },
  { icon: Mail, t: "Digital Invitations", c: "Beautiful invitations created, downloaded and shared without a designer." },
  { icon: MessageCircle, t: "WhatsApp Sharing", c: "Send invitations, passes and reminders straight to the chat your guests already use." },
  { icon: ImageIcon, t: "Shared Gallery", c: "Guests upload photos and video; you approve what appears in the memory book." },
  { icon: Gift, t: "Gifting & Registry", c: "Registry and account details in one tap, with a tracker of who gave what." },
  { icon: Truck, t: "Vendor Hub", c: "Call times, venue details, schedules and vendor check-in, all aligned." },
  { icon: BarChart3, t: "Live Analytics", c: "Arrivals by the minute, no-shows, peak crush times and a post-event report." },
  { icon: Wallet, t: "Souvenir Tracking", c: "Second checkpoint at the souvenir table so nobody collects twice." },
];

const faqs = [
  { q: "What if the venue has no internet?", a: "The scanner keeps a local copy of the guest list and verifies without a connection, syncing the moment signal returns. Manual entry is always available as a second backup." },
  { q: "Can someone screenshot a pass and share it?", a: "They can, and it will not work. Every pass is single-use — the first scan admits the guest, and any copy scanned afterwards flashes a warning with the exact time of the original entry." },
  { q: "Do my guests need to download an app?", a: "No. Everything runs in the browser on any phone. They tap a link, register, and their pass lives in the same tab or as a screenshot." },
  { q: "How many guests can it handle?", a: "Hundreds per event comfortably, with multiple ushers scanning at once from different phones. Larger events simply add more scanning devices." },
  { q: "How much work is it for the couple or client?", a: "Almost none. Guests register themselves, approval is a few taps on a phone, and ushers handle the door. The host is free to enjoy the day." },
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const active = journey[step];

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % journey.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] overflow-x-hidden">
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[45vw] rounded-full bg-[#c9a227]/[0.07] blur-[120px]" />
      </div>

      <nav className="relative z-30 mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-mark.jpg" alt="Story Box" width={34} height={34} className="rounded-lg" />
          <span className="text-[11px] uppercase tracking-[0.4em] font-[family-name:var(--font-sans)]">Story&nbsp;Box</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full border border-white/12 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)]">Sign In</Link>
          <Link href="/signup" className="hidden rounded-full bg-[#f5f1ea] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#080807] font-[family-name:var(--font-sans)] sm:block">Get Started</Link>
        </div>
      </nav>

      {/* HERO BENTO */}
      <section className="relative mx-auto max-w-[1320px] px-5 pb-6 pt-4 sm:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className={`${card} relative overflow-hidden p-7 sm:p-10 lg:col-span-8`}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c4634]/20 via-transparent to-transparent" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a227] font-[family-name:var(--font-sans)]">Event Experience Platform</p>
              <h1 className="mt-5 font-[family-name:var(--font-serif)] text-[10vw] leading-[0.9] tracking-[-0.02em] sm:text-[6.5vw] lg:text-[4.6vw]">
                {["Every guest", "accounted for."].map((l, i) => (
                  <span key={l} className="block overflow-hidden">
                    <motion.span custom={i} variants={reveal} initial="hidden" animate="show" className="block">{l}</motion.span>
                  </span>
                ))}
                <span className="block overflow-hidden">
                  <motion.span custom={2} variants={reveal} initial="hidden" animate="show" className="block italic text-[#c9a227]">Every moment remembered.</motion.span>
                </span>
              </h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 max-w-lg text-[14px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]">
                Registration, verified digital passes, seating and gate control — engineered so nobody queues and nobody gatecrashes.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }} className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="group relative overflow-hidden rounded-full bg-[#f5f1ea] px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-[#080807] font-[family-name:var(--font-sans)]">
                  <span className="relative z-10 transition-colors group-hover:text-[#f5f1ea]">Get Started</span>
                  <span className="absolute inset-0 -translate-x-full bg-[#1c4634] transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
                <Link href="/login" className="rounded-full border border-white/12 px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)]">I have an account</Link>
              </motion.div>
            </div>
          </div>

          <div className={`${card} relative flex items-center justify-center overflow-hidden bg-[#f5f1ea] p-7 lg:col-span-4 lg:row-span-2`}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[290px]">
              <motion.div animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="relative overflow-hidden rounded-[26px] bg-[#080807] p-6 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]">
                <motion.div initial={{ x: "-130%" }} animate={{ x: "230%" }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }} className="pointer-events-none absolute inset-y-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">Story Box</span>
                  <span className="flex items-center gap-1 rounded-full bg-[#c9a227]/15 px-2.5 py-1 text-[8px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]"><ShieldCheck className="h-2.5 w-2.5" /> Verified</span>
                </div>
                <p className="mt-7 text-[8px] uppercase tracking-[0.3em] text-white/35 font-[family-name:var(--font-sans)]">Admitting</p>
                <p className="mt-1 font-[family-name:var(--font-serif)] text-2xl text-[#f5f1ea]">Amara Johnson</p>
                <div className="mt-5 flex items-center gap-3 text-[9px] text-white/45 font-[family-name:var(--font-sans)]">
                  <span>SEC A</span><span className="h-3 w-px bg-white/20" /><span>TABLE 07</span><span className="h-3 w-px bg-white/20" /><span>SEAT 3</span>
                </div>
                <div className="my-5 border-t border-dashed border-white/15" />
                <div className="flex items-end justify-between">
                  <div className="grid grid-cols-8 gap-[3px]">
                    {[...Array(40)].map((_, i) => (
                      <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.25, 1, 0.3][i % 3] }} transition={{ delay: 0.9 + i * 0.012 }} className={`h-[6px] w-[6px] ${i % 3 === 0 ? "bg-[#f5f1ea]" : i % 4 === 0 ? "bg-[#c9a227]" : "bg-white/25"}`} />
                    ))}
                  </div>
                  <p className="font-mono text-[8px] tracking-widest text-white/35">SB-000148</p>
                </div>
              </motion.div>
              <p className="mt-6 text-center text-[9px] uppercase tracking-[0.3em] text-[#080807]/45 font-[family-name:var(--font-sans)]">The pass your guests receive</p>
            </motion.div>
          </div>

          {[
            { k: "0", v: "Gatecrashers", icon: ShieldCheck },
            { k: "1s", v: "Per check-in", icon: ScanLine },
            { k: "800+", v: "Guests handled", icon: Users },
            { k: "Live", v: "Arrivals board", icon: LayoutGrid },
          ].map((s, i) => (
            <motion.div key={s.v} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.08 }} className={`${card} flex flex-col justify-between p-5 lg:col-span-2`}>
              <s.icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <div className="mt-6">
                <p className="font-[family-name:var(--font-serif)] text-3xl text-[#f5f1ea]">{s.k}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{s.v}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="relative overflow-hidden border-y border-white/[0.07] bg-[#1c4634]/40 py-3.5">
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }} className="flex w-max gap-8 whitespace-nowrap">
          {[...Array(2)].map((_, d) => (
            <div key={d} className="flex gap-8">
              {["Weddings", "Conferences", "Brand Launches", "Galas", "Church Programs", "Concerts", "Private Dinners"].map((w) => (
                <span key={w} className="flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] text-white/45 font-[family-name:var(--font-sans)]">{w} <span className="text-[#c9a227]">✦</span></span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* INTERACTIVE JOURNEY */}
      <section className="relative mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/35 font-[family-name:var(--font-sans)]">How it works</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-4xl sm:text-5xl">From invitation to <span className="italic text-[#c9a227]">the door.</span></h2>
          </div>
          <p className="hidden text-[10px] uppercase tracking-[0.25em] text-white/25 font-[family-name:var(--font-sans)] sm:block">Tap a stage</p>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-7">
            {journey.map((j, i) => (
              <button
                key={j.label}
                onClick={() => setStep(i)}
                className={`${card} group relative overflow-hidden p-5 text-left transition-all ${i === step ? "border-[#c9a227]/40 bg-white/[0.05]" : "hover:bg-white/[0.04]"}`}
              >
                {i === step && (
                  <motion.span layoutId="jbar" className="absolute left-0 top-0 h-full w-[3px] bg-[#c9a227]" />
                )}
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-2.5 transition-colors ${i === step ? "bg-[#c9a227]/15" : "bg-white/[0.04]"}`}>
                    <j.icon className={`h-4 w-4 ${i === step ? "text-[#c9a227]" : "text-white/40"}`} strokeWidth={1.6} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[#c9a227]">0{i + 1}</span>
                      <h3 className="font-[family-name:var(--font-serif)] text-2xl text-[#f5f1ea]">{j.title}</h3>
                    </div>
                    <AnimatePresence initial={false}>
                      {i === step && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 overflow-hidden text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]"
                        >
                          {j.copy}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className={`${card} relative flex items-center justify-center overflow-hidden p-8 lg:col-span-5`}>
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 30%, ${active.accent}22, transparent 65%)` }} />
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[280px] overflow-hidden rounded-[26px] border p-6"
                style={{ borderColor: `${active.accent}55`, background: "linear-gradient(180deg,#141311,#0b0a09)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-[0.35em] font-[family-name:var(--font-sans)]" style={{ color: active.accent }}>Story Box</span>
                  <span className="rounded-full px-2.5 py-1 text-[8px] uppercase tracking-[0.15em] font-[family-name:var(--font-sans)]" style={{ color: active.accent, backgroundColor: `${active.accent}1f` }}>{active.badge}</span>
                </div>
                <p className="mt-8 text-[8px] uppercase tracking-[0.3em] text-white/30 font-[family-name:var(--font-sans)]">Admitting</p>
                <p className="mt-1 font-[family-name:var(--font-serif)] text-2xl">Amara Johnson</p>
                <div className="mx-auto my-5 h-px w-20" style={{ background: `linear-gradient(90deg,transparent,${active.accent}99,transparent)` }} />
                <div className="flex justify-center">
                  <div className="grid grid-cols-7 gap-[3px]" style={{ opacity: step === 0 ? 0.15 : step === 1 ? 0.35 : 1 }}>
                    {[...Array(35)].map((_, i) => (
                      <span key={i} className="h-[6px] w-[6px]" style={{ background: i % 3 === 0 ? active.accent : "rgba(255,255,255,0.25)" }} />
                    ))}
                  </div>
                </div>
                <p className="mt-5 text-center text-[9px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">{active.state}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/35 font-[family-name:var(--font-sans)]">The platform</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-4xl sm:text-5xl">Everything an event <span className="italic text-[#c9a227]">actually needs.</span></h2>
          </div>
          <Sparkles className="hidden h-5 w-5 text-[#c9a227] sm:block" />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.06 }}
              whileHover={{ y: -4 }}
              className={`${card} group p-5 transition-colors hover:border-[#c9a227]/30 hover:bg-white/[0.045]`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/[0.04] p-2.5 transition-colors group-hover:bg-[#c9a227]/15">
                  <f.icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
                </div>
                <h3 className="font-[family-name:var(--font-serif)] text-xl text-[#f5f1ea]">{f.t}</h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">{f.c}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="relative mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/35 font-[family-name:var(--font-sans)]">Built for everyone at your event</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { n: "01", title: "Planners", copy: "One console for every event you run — guest lists, RSVPs, seating, gate control, live analytics.", href: "/signup?role=planner", cta: "Start planning" },
            { n: "02", title: "Hosts", copy: "Watch your guest list fill in real time. Approve who comes. Then simply enjoy your day.", href: "/signup?role=host", cta: "Host an event" },
            { n: "03", title: "Guests", copy: "Confirm, receive a verified pass, walk straight in. No paper, no queue, no stress.", href: "/signup?role=guest", cta: "Find my event" },
            { n: "04", title: "Vendors", copy: "Call times, venue details, schedules and check-in — every supplier perfectly aligned.", href: "/signup?role=vendor", cta: "Join as vendor" },
          ].map((a, i) => (
            <motion.div key={a.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.06 }}>
              <Link href={a.href} className={`${card} group flex h-full flex-col p-6 transition-colors hover:border-[#c9a227]/35 hover:bg-white/[0.04]`}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] text-[#c9a227]">{a.n}</span>
                  <ArrowUpRight className="h-4 w-4 text-white/25 transition-all duration-500 group-hover:text-[#c9a227] group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-serif)] text-4xl tracking-tight text-[#f5f1ea] transition-transform duration-500 group-hover:translate-x-1">{a.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">{a.copy}</p>
                <span className="mt-5 text-[10px] uppercase tracking-[0.25em] text-[#c9a227] font-[family-name:var(--font-sans)]">{a.cta}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/35 font-[family-name:var(--font-sans)]">Questions</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-4xl leading-tight sm:text-5xl">Before you <span className="italic text-[#c9a227]">ask.</span></h2>
          </div>
          <div className="lg:col-span-8">
            {faqs.map((f, i) => (
              <div key={f.q} className="border-b border-white/[0.08]">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="font-[family-name:var(--font-serif)] text-xl text-[#f5f1ea] sm:text-2xl">{f.q}</span>
                  {open === i ? <Minus className="h-4 w-4 shrink-0 text-[#c9a227]" /> : <Plus className="h-4 w-4 shrink-0 text-white/40" />}
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden pb-5 pr-8 text-[13px] leading-relaxed text-white/50 font-[family-name:var(--font-sans)]"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSER */}
      <section className="relative mx-auto max-w-[1320px] px-5 pb-14 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative overflow-hidden rounded-3xl bg-[#f5f1ea] px-7 py-16 text-center text-[#080807] sm:px-10">
          <motion.div animate={{ x: ["-20%", "120%"] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute inset-y-0 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-[#c9a227]/15 to-transparent" />
          <p className="relative text-[10px] uppercase tracking-[0.4em] text-[#080807]/45 font-[family-name:var(--font-sans)]">Ready when you are</p>
          <h2 className="relative mx-auto mt-5 max-w-2xl font-[family-name:var(--font-serif)] text-4xl leading-[1.05] sm:text-6xl">
            Your event, <span className="italic text-[#1c4634]">handled.</span>
          </h2>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#080807] px-9 py-4 text-[11px] uppercase tracking-[0.2em] text-[#f5f1ea] font-[family-name:var(--font-sans)]">Create Your Event <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/login" className="rounded-full border border-[#080807]/20 px-9 py-4 text-[11px] uppercase tracking-[0.2em] text-[#080807]/70 font-[family-name:var(--font-sans)]">Sign In</Link>
          </div>
        </motion.div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-mark.jpg" alt="Story Box" width={26} height={26} className="rounded-md" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/40 font-[family-name:var(--font-sans)]">Story Box</span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/25 font-[family-name:var(--font-sans)]">Port Harcourt, Nigeria — A Story Box Experience</p>
        </div>
      </section>
    </main>
  );
}
