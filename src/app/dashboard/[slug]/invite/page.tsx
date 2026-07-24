"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, MessageCircle, Loader2, Copy, Check } from "lucide-react";

type EventData = {
  title: string; tagline: string; hostName: string;
  eventDate: string; eventTime: string; venue: string; address: string;
  dressCode: string | null; coverImage: string | null;
};

const THEMES = [
  { id: "midnight", label: "Midnight", bg: "#080807", panel: "#141311", ink: "#f5f1ea", accent: "#c9a227" },
  { id: "emerald", label: "Emerald", bg: "#0a1a13", panel: "#0f2419", ink: "#f0f5f1", accent: "#c9a227" },
  { id: "ivory", label: "Ivory", bg: "#f5f1ea", panel: "#ffffff", ink: "#141311", accent: "#1c4634" },
  { id: "wine", label: "Wine", bg: "#1a0d12", panel: "#26131a", ink: "#f7eef1", accent: "#d9a441" },
];

export default function InvitePage() {
  const params = useParams();
  const slug = String(params.slug);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ev, setEv] = useState<EventData | null>(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [note, setNote] = useState("Together with our families, we request the pleasure of your company");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [base, setBase] = useState("");

  useEffect(() => setBase(window.location.origin), []);

  useEffect(() => {
    fetch(`/api/e/invite?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { setEv(d.event); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!ev) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = 1080, H = 1350;
    c.width = W; c.height = H;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W / 2, H * 0.25, 40, W / 2, H * 0.25, W * 0.9);
    grad.addColorStop(0, theme.accent + "22");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const M = 70;
    ctx.strokeStyle = theme.accent + "66";
    ctx.lineWidth = 2;
    ctx.strokeRect(M, M, W - M * 2, H - M * 2);
    ctx.strokeStyle = theme.accent + "33";
    ctx.lineWidth = 1;
    ctx.strokeRect(M + 14, M + 14, W - (M + 14) * 2, H - (M + 14) * 2);

    ctx.textAlign = "center";

    ctx.fillStyle = theme.accent;
    ctx.font = "500 26px Georgia, serif";
    ctx.letterSpacing = "10px";
    ctx.fillText(ev.tagline.toUpperCase(), W / 2, 250);

    ctx.letterSpacing = "0px";
    ctx.fillStyle = theme.ink;
    const titleSize = ev.title.length > 22 ? 78 : 104;
    ctx.font = `400 ${titleSize}px Georgia, serif`;
    const words = ev.title.split(" ");
    let line = "", y = 400;
    const lines: string[] = [];
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 220 && line) { lines.push(line); line = w; }
      else line = test;
    });
    lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * (titleSize + 14)));
    y += lines.length * (titleSize + 14);

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, y + 24);
    ctx.lineTo(W / 2 + 90, y + 24);
    ctx.stroke();

    ctx.fillStyle = theme.ink + "b0";
    ctx.font = "400 30px Georgia, serif";
    const noteWords = note.split(" ");
    let nl = "", ny = y + 100;
    noteWords.forEach((w) => {
      const test = nl ? `${nl} ${w}` : w;
      if (ctx.measureText(test).width > W - 300 && nl) { ctx.fillText(nl, W / 2, ny); ny += 44; nl = w; }
      else nl = test;
    });
    ctx.fillText(nl, W / 2, ny);

    ny += 110;
    ctx.fillStyle = theme.accent;
    ctx.font = "500 22px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText(ev.eventDate.toUpperCase(), W / 2, ny);
    ctx.fillText(ev.eventTime.toUpperCase(), W / 2, ny + 44);

    ctx.letterSpacing = "3px";
    ctx.fillStyle = theme.ink + "cc";
    ctx.font = "400 26px Helvetica, Arial, sans-serif";
    ctx.fillText(ev.venue, W / 2, ny + 116);
    if (ev.address) {
      ctx.fillStyle = theme.ink + "88";
      ctx.font = "400 20px Helvetica, Arial, sans-serif";
      ctx.fillText(ev.address.slice(0, 60), W / 2, ny + 154);
    }

    let flow = ny + (ev.address ? 200 : 170);

    if (ev.dressCode) {
      ctx.fillStyle = theme.accent + "cc";
      ctx.font = "400 19px Helvetica, Arial, sans-serif";
      ctx.letterSpacing = "5px";
      const dc = `DRESS CODE — ${ev.dressCode.toUpperCase()}`;
      const dcWords = dc.split(" ");
      let dl = "";
      const dLines: string[] = [];
      dcWords.forEach((w) => {
        const test = dl ? `${dl} ${w}` : w;
        if (ctx.measureText(test).width > W - 260 && dl) { dLines.push(dl); dl = w; }
        else dl = test;
      });
      dLines.push(dl);
      dLines.forEach((l, i) => ctx.fillText(l, W / 2, flow + i * 34));
      flow += dLines.length * 34 + 30;
    }

    const footerY = H - 110;
    const linkY = footerY - 60;
    const labelY = linkY - 48;
    const bottomStart = Math.max(flow + 40, labelY) === labelY ? labelY : labelY;

    ctx.letterSpacing = "5px";
    ctx.fillStyle = theme.ink + "77";
    ctx.font = "400 18px Helvetica, Arial, sans-serif";
    ctx.fillText("CONFIRM YOUR SEAT AT", W / 2, labelY);

    ctx.fillStyle = theme.accent;
    ctx.font = "500 21px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(`${base.replace(/^https?:\/\//, "")}/e/${slug}`, W / 2, linkY);

    ctx.fillStyle = theme.ink + "55";
    ctx.font = "400 17px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "7px";
    ctx.fillText("POWERED BY STORY BOX", W / 2, footerY);
    ctx.letterSpacing = "0px";
  }, [ev, theme, note, base, slug]);

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${slug}-invitation.png`;
    a.click();
  }

  const rsvpUrl = base ? `${base}/e/${slug}` : "";
  const waText = encodeURIComponent(
    `${ev ? ev.title : ""}\n${ev ? ev.eventDate : ""} · ${ev ? ev.venue : ""}\n\n${note}\n\nConfirm your seat and get your digital pass:\n${rsvpUrl}`
  );

  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <Link href={`/dashboard/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Event console
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl">
          Digital <span className="italic text-[#c9a227]">invitation.</span>
        </motion.h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Design it, download it as an image, and share it anywhere.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c9a227]" /></div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className={`${card} flex items-center justify-center p-6`}>
              <canvas ref={canvasRef} className="h-auto w-full max-w-[420px] rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" />
            </div>

            <div className="space-y-4">
              <div className={`${card} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Theme</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setTheme(t)} className={`rounded-xl border px-3 py-3 text-[11px] font-[family-name:var(--font-sans)] ${theme.id === t.id ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/50"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${card} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Invitation words</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]" />
              </div>

              <div className={`${card} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Share</p>
                <button onClick={download} className="mt-3 flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#f5f1ea] text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                  <Download className="h-4 w-4" /> Download image
                </button>
                <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="mt-2 flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full bg-emerald-500 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                  <MessageCircle className="h-4 w-4" /> Send on WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard.writeText(rsvpUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="mt-2 flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/12 text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)]">
                  {copied ? <><Check className="h-4 w-4 text-emerald-400" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}
                </button>
                <p className="mt-4 text-[11px] leading-relaxed text-white/35 font-[family-name:var(--font-sans)]">
                  Download the image and attach it to WhatsApp, or send the link on its own.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
