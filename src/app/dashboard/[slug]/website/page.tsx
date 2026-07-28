"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { upload } from "@vercel/blob/client";
import { ArrowLeft, Loader2, Check, ExternalLink, UploadCloud, X, ImageIcon } from "lucide-react";

const GROUPS = [
  {
    title: "Look & Feel",
    fields: [
      { k: "hashtag", l: "Event Hashtag", p: "#OurBigDay" },
    ],
  },
  {
    title: "The Story",
    fields: [
      { k: "story", l: "Love / Brand Story", type: "area", p: "Tell your guests how it began\u2026" },
      { k: "dressCode", l: "Dress Code", p: "Traditional attire \u00B7 Black tie" },
      { k: "colours", l: "Event Colours", p: "Emerald green, gold, ivory" },
    ],
  },
  {
    title: "Getting There",
    fields: [
      { k: "ceremonyMap", l: "Ceremony Map Link", p: "https://maps.google.com/..." },
      { k: "receptionMap", l: "Reception Map Link", p: "https://maps.google.com/..." },
      { k: "livestream", l: "Livestream Link", p: "YouTube or Instagram live URL" },
    ],
  },
  {
    title: "On The Day",
    fields: [
      { k: "programNote", l: "Programme", type: "area", p: "2:00 PM Arrival\n3:00 PM Ceremony\n5:00 PM Reception" },
      { k: "menuNote", l: "Menu", type: "area", p: "Jollof rice, pepper soup, small chops\u2026" },
    ],
  },
  {
    title: "Gifting",
    fields: [
      { k: "giftNote", l: "Gift Message", type: "area", p: "Your presence is our present, but if you wish\u2026" },
      { k: "bankDetails", l: "Bank / Registry Details", type: "area", p: "GTBank \u00B7 0123456789 \u00B7 Chioma Amadi" },
    ],
  },
];

type Form = Record<string, string>;

type PlaceRow = { name: string; url: string };

function parsePlaces(text: string): PlaceRow[] {
  return (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (l.includes("|")) {
        const [name, ...rest] = l.split("|");
        return { name: name.trim(), url: rest.join("|").trim() };
      }
      const m = l.match(/https?:\/\/\S+/);
      if (m) return { name: l.replace(m[0], "").replace(/[\s:,\u2014-]+$/, "").trim(), url: m[0] };
      return { name: l, url: "" };
    });
}

function serializePlaces(rows: PlaceRow[]): string {
  return rows
    .filter((r) => r.name.trim() || r.url.trim())
    .map((r) => `${r.name.trim()} | ${r.url.trim()}`)
    .join("\n");
}

function PlacesEditor({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [rows, setRows] = useState<PlaceRow[]>(() => {
    const parsed = parsePlaces(value);
    return parsed.length ? parsed : [{ name: "", url: "" }];
  });

  function commit(next: PlaceRow[]) {
    setRows(next);
    onChange(next.filter((r) => r.name.trim() || r.url.trim()).map((r) => `${r.name.trim()} | ${r.url.trim()}`).join("\n"));
  }

  function update(i: number, patch: Partial<PlaceRow>) {
    commit(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function add() {
    setRows([...rows, { name: "", url: "" }]);
  }
  function remove(i: number) {
    const next = rows.filter((_, j) => j !== i);
    commit(next.length ? next : [{ name: "", url: "" }]);
  }

  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";
  const inp = "w-full sb-input px-4 py-3 text-[13px] text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";

  return (
    <div className="mt-5">
      <label className={lbl}>{label}</label>
      <p className="mt-1.5 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">{hint}</p>
      <div className="mt-3 space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <input value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name (e.g. Hotel Presidential)" className={inp} />
              <input value={r.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="Google Maps link (optional)" className={inp} />
            </div>
            <button onClick={() => remove(i)} title="Remove" className="mt-1.5 rounded-full border border-white/10 p-2 text-white/40 transition-colors hover:border-red-500/40 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 rounded-full border border-dashed border-[#c9a227]/40 px-5 py-2 text-[10px] uppercase tracking-[0.15em] text-[#c9a227] transition-colors hover:bg-[#c9a227]/[0.08] font-[family-name:var(--font-sans)]">
        + Add another
      </button>
    </div>
  );
}
export default function WebsiteEditor() {
  const params = useParams();
  const slug = String(params.slug);
  const [form, setForm] = useState<Form>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [err, setErr] = useState("");

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

  async function doUpload(field: string, files: FileList | null, append: boolean) {
    if (!files || files.length === 0) return;
    setErr("");
    setUploading(field);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const blob = await upload(`${slug}/${field}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        urls.push(blob.url);
      }
      if (append) {
        const existing = (form[field] || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        setForm({ ...form, [field]: [...existing, ...urls].join("\n") });
      } else {
        setForm({ ...form, [field]: urls[0] });
      }
    } catch (e) {
      setErr((e as Error).message || "Upload failed. Please try again.");
    }
    setUploading("");
  }

  function removeGalleryUrl(url: string) {
    const rest = (form.gallery || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).filter((u) => u !== url);
    setForm({ ...form, gallery: rest.join("\n") });
  }

  const galleryUrls = (form.gallery || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  const card = "sb-surface sb-lift";
  const inp = "mt-2 w-full sb-input px-4 py-3 text-[#f5f1ea] outline-none focus:border-[#c9a227]/60 font-[family-name:var(--font-sans)]";
  const lbl = "text-[10px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]";
  const upBtn = "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9a227]/40 bg-[#c9a227]/[0.05] px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-[#c9a227] transition-colors hover:bg-[#c9a227]/[0.1] font-[family-name:var(--font-sans)]";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[820px]">
        <TopBar back={`/dashboard/${slug}`} backLabel="Event" />
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
            {err && <p className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-5 py-3 text-[12px] text-red-400 font-[family-name:var(--font-sans)]">{err}</p>}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${card} mt-7 p-6`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">Photos</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Event Logo</label>
                  <div className="mt-2 flex items-center gap-4">
                    {form.logoUrl ? (
                      <div className="relative">
                        <img src={form.logoUrl} alt="" className="h-20 w-20 rounded-2xl border border-white/12 object-cover" />
                        <button onClick={() => setForm({ ...form, logoUrl: "" })} className="absolute -right-2 -top-2 rounded-full border border-white/20 bg-[#080807] p-1 text-white/60 hover:text-red-400"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-black/30"><ImageIcon className="h-5 w-5 text-white/20" /></div>
                    )}
                    <label className={`flex-1 ${upBtn}`}>
                      {uploading === "logoUrl" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {uploading === "logoUrl" ? "Uploading..." : form.logoUrl ? "Replace" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => doUpload("logoUrl", e.target.files, false)} disabled={!!uploading} />
                    </label>
                  </div>
                  <p className="mt-2 text-[10px] text-white/30 font-[family-name:var(--font-sans)]">Square works best. JPG, PNG or WebP, up to 8MB.</p>
                </div>

                <div>
                  <label className={lbl}>Cover Photo</label>
                  <div className="mt-2">
                    {form.coverImage ? (
                      <div className="relative">
                        <img src={form.coverImage} alt="" className="h-28 w-full rounded-2xl border border-white/12 object-cover" />
                        <button onClick={() => setForm({ ...form, coverImage: "" })} className="absolute right-2 top-2 rounded-full border border-white/20 bg-[#080807]/80 p-1.5 text-white/70 hover:text-red-400"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <label className={upBtn}>
                        {uploading === "coverImage" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {uploading === "coverImage" ? "Uploading..." : "Upload cover photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => doUpload("coverImage", e.target.files, false)} disabled={!!uploading} />
                      </label>
                    )}
                    {form.coverImage && (
                      <label className={`mt-2 ${upBtn}`}>
                        {uploading === "coverImage" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        Replace cover
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => doUpload("coverImage", e.target.files, false)} disabled={!!uploading} />
                      </label>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-white/30 font-[family-name:var(--font-sans)]">Wide landscape photo. This sits behind your event title.</p>
                </div>
              </div>

              <div className="mt-7">
                <label className={lbl}>Gallery</label>
                {galleryUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {galleryUrls.map((u) => (
                      <div key={u} className="relative">
                        <img src={u} alt="" className="h-24 w-full rounded-xl border border-white/10 object-cover" />
                        <button onClick={() => removeGalleryUrl(u)} className="absolute right-1.5 top-1.5 rounded-full border border-white/20 bg-[#080807]/80 p-1 text-white/70 hover:text-red-400"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`mt-3 ${upBtn}`}>
                  {uploading === "gallery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading === "gallery" ? "Uploading..." : "Add gallery photos"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => doUpload("gallery", e.target.files, true)} disabled={!!uploading} />
                </label>
                <p className="mt-2 text-[10px] text-white/30 font-[family-name:var(--font-sans)]">Select several at once. Remember to press Save Website when you are done.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${card} mt-4 p-6`}>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">For Travelling Guests</p>
              <PlacesEditor label="Hotels" hint="Each becomes a named button guests can tap to open the map." value={form.hotels || ""} onChange={(v) => setForm({ ...form, hotels: v })} />
              <PlacesEditor label="Restaurants" hint="Great spots to eat nearby." value={form.restaurants || ""} onChange={(v) => setForm({ ...form, restaurants: v })} />
              <PlacesEditor label="Fun Spots" hint="Things to do around the venue." value={form.funSpots || ""} onChange={(v) => setForm({ ...form, funSpots: v })} />
            </motion.div>

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
              <button onClick={save} disabled={busy || !!uploading} className="flex w-full min-h-[56px] items-center justify-center gap-2 sb-btn text-[11px] uppercase tracking-[0.2em] font-semibold text-[#080807] shadow-[0_10px_40px_rgba(0,0,0,0.6)] font-[family-name:var(--font-sans)] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saved</> : "Save Website"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}