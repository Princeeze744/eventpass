"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function TopBar({
  back, backLabel = "Back", title, right,
}: {
  back?: string; backLabel?: string; title?: string; right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="sb-sticky -mx-5 mb-6 px-5 py-3.5 sm:-mx-8 sm:px-8">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (back ? router.push(back) : router.back())}
            className="sb-ghost group flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/60 font-[family-name:var(--font-sans)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>

          <Link href="/dashboard" className="sb-ghost flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/60 font-[family-name:var(--font-sans)]">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Console</span>
          </Link>

          {title && (
            <span className="hidden truncate text-[11px] uppercase tracking-[0.2em] text-white/35 md:inline font-[family-name:var(--font-sans)]">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {right}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo-mark.jpg" alt="Story Box" width={26} height={26} className="rounded-md" />
          </Link>
        </div>
      </div>
    </div>
  );
}
