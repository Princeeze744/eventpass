"use client";

import { useEffect, useState } from "react";

export default function Countdown({ date }: { date: string }) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(date).getTime();
    if (isNaN(target)) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [date]);

  if (!left) return null;

  return (
    <div className="mt-8 flex justify-center gap-3">
      {[
        { v: left.d, l: "Days" },
        { v: left.h, l: "Hours" },
        { v: left.m, l: "Mins" },
        { v: left.s, l: "Secs" },
      ].map((u) => (
        <div key={u.l} className="min-w-[72px] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <p className="font-[family-name:var(--font-serif)] text-3xl text-[#c9a227]">{String(u.v).padStart(2, "0")}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">{u.l}</p>
        </div>
      ))}
    </div>
  );
}
