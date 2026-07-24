"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Check, ExternalLink } from "lucide-react";

const GROUPS = [
  {
    title: "Look & Feel",
    fields: [
      { k: "coverImage", l: "Cover Photo URL", p: "https://... paste any image link" },
      { k: "gallery", l: "Gallery Photo URLs", type: "area", p: "One image URL per line" },
      { k: "hashtag", l: "Event Hashtag", p: "#OurBigDay" },
    ],
  },
  {
    title: "The Story",
    fields: [
      { k: "story", l: "Love / Brand Story", type: "area", p: "Tell your guests how it began…" },
      { k: "dressCode", l: "Dress Code", p: "Traditional attire · Black tie" },
      { k: "colours", l: "Event Colours", p: "Emerald green, gold, ivory" },
    ],
  },
  {
    title: "Getting There",
    fields: [
      { k: "ceremonyName", l: "Ceremony Venue", p: "St. Mary's Cathedral, Port Harcourt" },
      { k: "ceremonyMap", l: "Ceremony Map Link", p: "https://maps.google.com/..." },
      { k: "receptionMap", l: "Reception Map Link", p: "https://maps.google.com/..." },
      { k: "livestream", l: "Livestream Link", p: "YouTube or Instagram live URL" },
    ],
  },
  {
    title: "For Travelling Guests",
    fields: [
      { k: "hotels", l: "Hotels", type: "area", p: "One per line: Hotel Presidential — 5 mins from venue" },
      { k: "restaurants", l: "Restaurants", type: "area", p: "One per line" },
      { k: "funSpots", l: "Fun Spots", type: "area", p: "One per line" },
    ],
  },
  {
    title: "On The Day",
    fields: [
      { k: "programNote", l: "Programme", type: "area", p: "2:00 PM Arrival\n3:00 PM Ceremony\n5:00 PM Reception" },
      { k: "menuNote", l: "Menu", type: "area", p: "Jollof rice, pepper soup, small chops…" },
    ],
  },
  {
    title: "Gifting",
    fields: [
      { k: "giftNote", l: "Gift Message", type: "area", p: "Your presence is our present, but if you wish…" },
      { k: "bankDetails", l: "Bank / Registry Details", type: "area", p: "GTBank · 0123456789 · Chioma Amadi" },
    ],
  },
];

type Form = Record<string, string>;

export default function WebsiteEditor() {
  const params = useParams();
  const slug = String(params.slug);
  const [form, setForm] = useState<Form>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/e/website/get?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { setForm(d.event || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  async function save() {
    setBusy(true);
    await fetch("/api/e/website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...form }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const card = "sb-surface sb-lift";
  const inp = "mt-2 w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[820px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/dashboard/${slug}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Event console
          </Link>
          <Link href={`/e/${slug}`} target="_blank" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#c9a227] font-[family-name:var(--font-sans)]">
            View live site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-[family-name:var(--font-serif)] text-5xl sb-display">
          Event <span className="italic text-[#c9a227]">website.</span>
        </motion.h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Everything you fill in appears on your public event page. Leave anything blank to hide that section.
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#c9a227]" /></div>
        ) : (
          <>
            {GROUPS.map((g, gi) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.06 }}
                className={`${card} mt-4 p-6`}
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">{g.title}</p>
                {g.fields.map((f) => (
                  <div key={f.k} className="mt-5">
                    <label className={lbl}>{f.l}</label>
                    {f.type === "area" ? (
                      <textarea
                        rows={4}
                        value={form[f.k] || ""}
                        onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                        placeholder={f.p}
                        className={`${inp} resize-y`}
                      />
                    ) : (
                      <input
                        value={form[f.k] || ""}
                        onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                        placeholder={f.p}
                        className={inp}
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            ))}

            <div className="sticky bottom-5 mt-6">
              <button onClick={save} disabled={busy} className="flex w-full min-h-[56px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] shadow-[0_10px_40px_rgba(0,0,0,0.6)] font-[family-name:var(--font-sans)] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saved</> : "Save Website"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}