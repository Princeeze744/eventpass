"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-[#c9a227] font-[family-name:var(--font-sans)]"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
      {label}
    </button>
  );
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/30 font-[family-name:var(--font-sans)]">
      {items.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {c.href ? (
            <Link href={c.href} className="transition-colors hover:text-[#c9a227]">{c.label}</Link>
          ) : (
            <span className="text-white/55">{c.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="h-3 w-3 text-white/15" />}
        </span>
      ))}
    </nav>
  );
}

const EVENT_TABS = [
  { seg: "admin", label: "Guests" },
  { seg: "seating", label: "Seating" },
  { seg: "vendors", label: "Vendors" },
  { seg: "host", label: "Client view" },
  { seg: "live", label: "Live" },
];

export function EventNav({ slug }: { slug: string }) {
  const path = usePathname();
  const current = path.split("/").pop();

  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
      {EVENT_TABS.map((t) => {
        const active = current === t.seg;
        return (
          <Link
            key={t.seg}
            href={`/e/${slug}/${t.seg}`}
            className={`relative shrink-0 rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-colors font-[family-name:var(--font-sans)] ${active ? "text-[#080807]" : "text-white/50 hover:text-white/80"}`}
          >
            {active && (
              <motion.span
                layoutId="eventNavPill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#f6f2ea] to-[#e2d9c8] shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_6px_18px_-6px_rgba(0,0,0,0.7)]"
              />
            )}
            <span className="relative">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function BrandBar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/dashboard" className="group flex items-center gap-3">
        <Image src="/brand/logo-mark.jpg" alt="Story Box" width={30} height={30} className="rounded-lg transition-transform duration-500 group-hover:scale-105" />
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/45 transition-colors group-hover:text-[#c9a227] font-[family-name:var(--font-sans)]">Story&nbsp;Box</span>
      </Link>
      {right}
    </div>
  );
}
