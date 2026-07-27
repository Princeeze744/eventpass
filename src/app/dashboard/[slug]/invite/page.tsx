"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, MessageCircle, Loader2, Copy, Check, Bold, Italic, Underline } from "lucide-react";

type EventData = {
  title: string; tagline: string; hostName: string;
  eventDate: string; eventTime: string; venue: string; address: string;
  dressCode: string | null; coverImage: string | null; logoUrl: string | null;
  accentColor?: string | null;
};

const BG_PRESETS = [
  { label: "Midnight", c: "#080807" },
  { label: "Emerald", c: "#0a1a13" },
  { label: "Ivory", c: "#f5f1ea" },
  { label: "Wine", c: "#1a0d12" },
];

const FONTS = [
  { id: "serif", label: "Elegant", css: "Georgia, serif" },
  { id: "sans", label: "Modern", css: "Helvetica, Arial, sans-serif" },
  { id: "classic", label: "Classic", css: "'Times New Roman', Times, serif" },
];

type Seg = { text: string; bold: boolean; italic: boolean; underline: boolean };

function parseStyled(src: string): Seg[] {
  const segs: Seg[] = [];
  let bold = false, italic = false, underline = false, buf = "", i = 0;
  const push = () => { if (buf) { segs.push({ text: buf, bold, italic, underline }); buf = ""; } };
  while (i < src.length) {
    if (src.startsWith("**", i)) { push(); bold = !bold; i += 2; continue; }
    if (src[i] === "*") { push(); italic = !italic; i += 1; continue; }
    if (src[i] === "~") { push(); underline = !underline; i += 1; continue; }
    buf += src[i]; i += 1;
  }
  push();
  return segs;
}

// WCAG relative luminance - the standard the pros use for readable contrast
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function bestTextFor(bg: string): string {
  return luminance(bg) > 0.35 ? "#141311" : "#f5f1ea";
}

export default function InvitePage() {
  const params = useParams();
  const slug = String(params.slug);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const [ev, setEv] = useState<EventData | null>(null);
  const [bg, setBg] = useState("#080807");
  const [ink, setInk] = useState("#f5f1ea");
  const [inkTouched, setInkTouched] = useState(false);
  const [fontKey, setFontKey] = useState("serif");
  const [note, setNote] = useState("Together with our families, we request the pleasure of your company");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [base, setBase] = useState("");

  const accent = ev?.accentColor || "#c9a227";
  const noteFont = (FONTS.find((f) => f.id === fontKey) || FONTS[0]).css;

  function pickBg(c: string) {
    setBg(c);
    if (!inkTouched) setInk(bestTextFor(c));
  }

  useEffect(() => setBase(window.location.origin), []);

  useEffect(() => {
    fetch(`/api/e/invite?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { setEv(d.event); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!ev?.logoUrl) { setLogoImg(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLogoImg(img);
    img.onerror = () => setLogoImg(null);
    img.src = ev.logoUrl;
  }, [ev]);

  function applyStyle(marker: string) {
    const ta = noteRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (s === e) return;
    const sel = note.slice(s, e);
    let next: string;
    if (sel.startsWith(marker) && sel.endsWith(marker) && sel.length >= marker.length * 2 + 1) {
      next = note.slice(0, s) + sel.slice(marker.length, sel.length - marker.length) + note.slice(e);
    } else {
      next = note.slice(0, s) + marker + sel + marker + note.slice(e);
    }
    setNote(next);
    requestAnimationFrame(() => ta.focus());
  }

  useEffect(() => {
    if (!ev) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = 1080, H = 1350;
    c.width = W; c.height = H;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W / 2, H * 0.25, 40, W / 2, H * 0.25, W * 0.9);
    grad.addColorStop(0, accent + "22");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const M = 70;
    ctx.strokeStyle = accent + "66";
    ctx.lineWidth = 2;
    ctx.strokeRect(M, M, W - M * 2, H - M * 2);
    ctx.strokeStyle = accent + "33";
    ctx.lineWidth = 1;
    ctx.strokeRect(M + 14, M + 14, W - (M + 14) * 2, H - (M + 14) * 2);

    ctx.textAlign = "center";

    let topY = 250;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const size = 130;
      const lx = (W - size) / 2;
      const ly = 140;
      ctx.save();
      ctx.beginPath();
      const r = 26;
      ctx.moveTo(lx + r, ly);
      ctx.arcTo(lx + size, ly, lx + size, ly + size, r);
      ctx.arcTo(lx + size, ly + size, lx, ly + size, r);
      ctx.arcTo(lx, ly + size, lx, ly, r);
      ctx.arcTo(lx, ly, lx + size, ly, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, lx, ly, size, size);
      ctx.restore();
      topY = ly + size + 70;
    }

    ctx.fillStyle = accent;
    ctx.font = "500 26px Georgia, serif";
    ctx.letterSpacing = "10px";
    ctx.fillText(ev.tagline.toUpperCase(), W / 2, topY);

    ctx.letterSpacing = "0px";
    ctx.fillStyle = ink;
    const titleSize = ev.title.length > 22 ? 78 : 104;
    ctx.font = `400 ${titleSize}px Georgia, serif`;
    const words = ev.title.split(" ");
    let line = "", y = topY + 150;
    const lines: string[] = [];
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 220 && line) { lines.push(line); line = w; }
      else line = test;
    });
    lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * (titleSize + 14)));
    y += lines.length * (titleSize + 14);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, y + 24);
    ctx.lineTo(W / 2 + 90, y + 24);
    ctx.stroke();

    ctx.textAlign = "left";
    const inkNote = ink + "b0";
    const nSize = 30;
    const maxW = W - 300;
    type Tok = { text: string; b: boolean; i: boolean; u: boolean; w: number };
    const toks: Tok[] = [];
    for (const sg of parseStyled(note)) {
      for (const p of sg.text.split(/(\s+)/)) {
        if (!p) continue;
        ctx.font = `${sg.italic ? "italic " : ""}${sg.bold ? "700" : "400"} ${nSize}px ${noteFont}`;
        toks.push({ text: p, b: sg.bold, i: sg.italic, u: sg.underline, w: ctx.measureText(p).width });
      }
    }
    const nLines: Tok[][] = [];
    let cur: Tok[] = [], curW = 0;
    for (const t of toks) {
      const isSpace = /^\s+$/.test(t.text);
      if (curW + t.w > maxW && cur.length && !isSpace) { nLines.push(cur); cur = []; curW = 0; }
      if (isSpace && cur.length === 0) continue;
      cur.push(t); curW += t.w;
    }
    if (cur.length) nLines.push(cur);
    let ny = y + 100;
    for (const ln of nLines) {
      while (ln.length && /^\s+$/.test(ln[ln.length - 1].text)) ln.pop();
      const lw = ln.reduce((a, t) => a + t.w, 0);
      let x = (W - lw) / 2;
      for (const t of ln) {
        ctx.font = `${t.i ? "italic " : ""}${t.b ? "700" : "400"} ${nSize}px ${noteFont}`;
        ctx.fillStyle = inkNote;
        ctx.fillText(t.text, x, ny);
        if (t.u && !/^\s+$/.test(t.text)) {
          ctx.strokeStyle = inkNote;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, ny + 8);
          ctx.lineTo(x + t.w, ny + 8);
          ctx.stroke();
        }
        x += t.w;
      }
      ny += 44;
    }
    if (nLines.length) ny -= 44;
    else ny = y + 56;
    ctx.textAlign = "center";

    ny += 110;
    const safeBottom = H - 240;
    if (ny + 200 > safeBottom) ny = Math.max(y + 130, safeBottom - 200);
    ctx.fillStyle = accent;
    ctx.font = "500 22px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText(ev.eventDate.toUpperCase(), W / 2, ny);
    ctx.fillText(ev.eventTime.toUpperCase(), W / 2, ny + 44);

    ctx.letterSpacing = "3px";
    ctx.fillStyle = ink + "cc";
    ctx.font = "400 26px Helvetica, Arial, sans-serif";
    ctx.fillText(ev.venue, W / 2, ny + 116);
    if (ev.address && ny + 154 < safeBottom) {
      ctx.fillStyle = ink + "88";
      ctx.font = "400 20px Helvetica, Arial, sans-serif";
      ctx.fillText(ev.address.slice(0, 60), W / 2, ny + 154);
    }

    let flow = ny + (ev.address ? 200 : 170);

    const footerTop = H - 220;

    if (ev.dressCode && flow < footerTop - 40) {
      ctx.fillStyle = accent + "cc";
      ctx.font = "400 19px Helvetica, Arial, sans-serif";
      ctx.letterSpacing = "5px";
      const dc = `DRESS CODE \u2014 ${ev.dressCode.toUpperCase()}`;
      let dl = "";
      const dLines: string[] = [];
      dc.split(" ").forEach((w) => {
        const test = dl ? `${dl} ${w}` : w;
        if (ctx.measureText(test).width > W - 260 && dl) { dLines.push(dl); dl = w; }
        else dl = test;
      });
      dLines.push(dl);
      dLines.forEach((l, i) => {
        if (flow + i * 34 < footerTop) ctx.fillText(l, W / 2, flow + i * 34);
      });
      flow += dLines.length * 34 + 30;
    }

    const footerY = H - 110;
    const linkY = footerY - 60;
    const labelY = linkY - 48;

    ctx.letterSpacing = "5px";
    ctx.fillStyle = ink + "77";
    ctx.font = "400 18px Helvetica, Arial, sans-serif";
    ctx.fillText("CONFIRM YOUR SEAT AT", W / 2, labelY);

    ctx.fillStyle = accent;
    ctx.font = "500 21px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(`${base.replace(/^https?:\/\//, "")}/e/${slug}`, W / 2, linkY);

    ctx.fillStyle = ink + "55";
    ctx.font = "400 17px Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "7px";
    ctx.fillText("POWERED BY STORY BOX", W / 2, footerY);
    ctx.letterSpacing = "0px";
  }, [ev, bg, ink, accent, note, base, slug, logoImg, noteFont]);

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${slug}-invitation.png`;
    a.click();
  }

  const cleanNote = note.replace(/\*\*/g, "").replace(/[*~]/g, "");
  const rsvpUrl = base ? `${base}/e/${slug}` : "";
  const waText = encodeURIComponent(
    `${ev ? ev.title : ""}\n${ev ? ev.eventDate : ""} \u00B7 ${ev ? ev.venue : ""}\n\n${cleanNote}\n\nConfirm your seat and get your digital pass:\n${rsvpUrl}`
  );

  const card = "sb-surface sb-lift";
  const tbtn = "flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-black/30 text-white/60 transition-colors hover:border-[#c9a227]/50 hover:text-[#c9a227]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <TopBar back={`/dashboard/${slug}`} backLabel="Event" />
        <Link href={`/dashboard/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Event console
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
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
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Colours</p>

                <div className="mt-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-[family-name:var(--font-sans)]">Background colour</label>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
                      <span className="rounded-xl p-[2px]" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
                        <input
                          type="color"
                          value={bg}
                          onChange={(e) => pickBg(e.target.value)}
                          className="block h-9 w-12 cursor-pointer rounded-[10px] border-0 bg-black/30 p-1"
                        />
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 font-[family-name:var(--font-sans)]">Custom</span>
                    </label>
                    <div className="h-10 w-px shrink-0 bg-white/10" />
                    <div className="flex flex-1 gap-2">
                      {BG_PRESETS.map((p) => (
                        <button key={p.label} onClick={() => pickBg(p.c)} className="flex flex-1 flex-col items-center gap-1">
                          <span
                            className={`relative flex h-9 w-full items-center justify-center rounded-lg border transition-all ${bg === p.c ? "border-white/80" : "border-white/15"}`}
                            style={{ background: p.c }}
                          >
                            {bg === p.c && (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke={luminance(p.c) > 0.35 ? "#141311" : "#f5f1ea"} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            )}
                          </span>
                          <span className={`text-[8px] uppercase tracking-[0.12em] font-[family-name:var(--font-sans)] ${bg === p.c ? "text-white/70" : "text-white/35"}`}>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-[family-name:var(--font-sans)]">Text colour</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={ink}
                      onChange={(e) => { setInk(e.target.value); setInkTouched(true); }}
                      className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-white/15 bg-black/30 p-1"
                    />
                    <p className="flex-1 text-[10px] leading-relaxed text-white/35 font-[family-name:var(--font-sans)]">
                      Picks a readable colour automatically when you change the background. Adjust it here if you want something specific.
                    </p>
                  </div>
                  {inkTouched && (
                    <button onClick={() => { setInk(bestTextFor(bg)); setInkTouched(false); }} className="mt-2 text-[10px] uppercase tracking-[0.15em] text-white/35 underline-offset-2 hover:text-white/60 hover:underline font-[family-name:var(--font-sans)]">
                      Back to automatic
                    </button>
                  )}
                </div>
              </div>

              <div className={`${card} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Invitation words</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => applyStyle("**")} title="Bold" className={tbtn}><Bold className="h-4 w-4" /></button>
                  <button onClick={() => applyStyle("*")} title="Italic" className={tbtn}><Italic className="h-4 w-4" /></button>
                  <button onClick={() => applyStyle("~")} title="Underline" className={tbtn}><Underline className="h-4 w-4" /></button>
                  <div className="ml-auto flex gap-1">
                    {FONTS.map((f) => (
                      <button key={f.id} onClick={() => setFontKey(f.id)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-[family-name:var(--font-sans)] ${fontKey === f.id ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-white/10 bg-black/30 text-white/45"}`} style={{ fontFamily: f.css }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea ref={noteRef} value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-3 w-full resize-y sb-input px-4 py-3 text-[13px] text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]" />
                <p className="mt-2 text-[10px] leading-relaxed text-white/30 font-[family-name:var(--font-sans)]">
                  Highlight any words, then tap B, I or U &mdash; the invitation updates instantly. The little ** and ~ marks are how styling is stored; they never appear on the invitation.
                </p>
              </div>

              <div className={`${card} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Share</p>
                <button onClick={download} className="mt-3 flex w-full min-h-[50px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                  <Download className="h-4 w-4" /> Download image
                </button>
                <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="mt-2 flex w-full min-h-[50px] items-center justify-center gap-2 rounded-full bg-emerald-500 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                  <MessageCircle className="h-4 w-4" /> Send on WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard.writeText(rsvpUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="mt-2 flex w-full min-h-[50px] items-center justify-center gap-2 sb-ghost text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)]">
                  {copied ? <><Check className="h-4 w-4 text-emerald-400" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}