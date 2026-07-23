"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackHome() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur-md font-[family-name:var(--font-sans)] hover:text-white/90"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Home
    </button>
  );
}
