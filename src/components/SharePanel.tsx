"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, MessageCircle } from "lucide-react";

export default function SharePanel({
  slug, title, eventDate, venue, adminKey, usherKey,
}: {
  slug: string; title: string; eventDate: string; venue: string; adminKey: string; usherKey: string;
}) {
  const [copied, setCopied] = useState("");
  const [base, setBase] = useState("");

  useEffect(() => {
    setBase(window.location.origin);
  }, []);

  const rsvpUrl = base ? `${base}/e/${slug}/rsvp` : "";
  const adminUrl = base ? `${base}/e/${slug}/admin` : "";
  const scanUrl = base ? `${base}/e/${slug}/scan` : "";

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  const waText = encodeURIComponent(
    `You are invited to ${title} — ${eventDate} at ${venue}.\n\nRegister here to receive your digital pass:\n${rsvpUrl}`
  );

  const row = "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3";
  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className={`${card} p-6`}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Guest registration link</p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-[116px] w-[116px] shrink-0 items-center justify-center rounded-2xl bg-[#f5f1ea] p-2.5">
            {rsvpUrl ? (
              <QRCodeSVG value={rsvpUrl} size={96} level="M" bgColor="#f5f1ea" fgColor="#080807" />
            ) : (
              <span className="text-[9px] uppercase tracking-widest text-[#080807]/40">Loading</span>
            )}
          </div>
          <div className="flex-1">
            <p className="break-all font-mono text-[11px] text-[#c9a227]">{rsvpUrl || `/e/${slug}/rsvp`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy("rsvp", rsvpUrl)} disabled={!rsvpUrl} className="flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)] disabled:opacity-40">
                {copied === "rsvp" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied === "rsvp" ? "Copied" : "Copy"}
              </button>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
          Share this link or print the QR on invitation cards. Guests register themselves and receive a verified pass.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Team access</p>

        <div className="mt-3 space-y-2">
          <div className={row}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">Host terminal</p>
              <p className="font-mono text-[13px] text-[#c9a227]">{adminKey}</p>
            </div>
            <button onClick={() => copy("admin", `${adminUrl}\nKey: ${adminKey}`)} className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] uppercase text-white/60 font-[family-name:var(--font-sans)]">
              {copied === "admin" ? "Copied" : "Copy"}
            </button>
          </div>

          <div className={row}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">Gate scanner</p>
              <p className="font-mono text-[13px] text-[#c9a227]">{usherKey}</p>
            </div>
            <button onClick={() => copy("gate", `${scanUrl}\nKey: ${usherKey}`)} className="rounded-full border border-white/12 px-3 py-1.5 text-[10px] uppercase text-white/60 font-[family-name:var(--font-sans)]">
              {copied === "gate" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/e/${slug}/host`} className="rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Client view</a>
          <a href={`/e/${slug}/admin`} className="rounded-full bg-[#f5f1ea] px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">Open host terminal</a>
          <a href={`/e/${slug}/scan`} className="rounded-full border border-white/12 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Open scanner</a>
          <a href={`/dashboard/${slug}/invite`} className="rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Invitation</a>
          <a href={`/dashboard/${slug}/invite`} className="rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Invitation</a>
          <a href={`/dashboard/${slug}/settings`} className="rounded-full border border-white/12 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Settings</a>
          <a href={`/dashboard/${slug}/website`} className="rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Edit website</a>
          <a href={`/e/${slug}/live`} className="rounded-full border border-[#c9a227]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] font-[family-name:var(--font-sans)]">Live board</a>
          <a href={`/e/${slug}`} className="rounded-full border border-white/12 px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]">Event page</a>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
          Give the host key only to the client. Give the gate key only to ushers.
        </p>
      </div>
    </div>
  );
}
