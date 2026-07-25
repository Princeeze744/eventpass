# STORY BOX — Project Context

## What this is
Multi-tenant event platform. Planners create events; guests self-register and receive
verified single-use digital passes; ushers scan at the gate. Built by Prince Ochidi (CTO),
owner is the Story Box brand holder.

## Two products, one repo
- `main` branch = EventPass — a single hard-coded wedding (Chioma & Obinna, Dec 19 2026).
  DEPLOYED and LIVE at eventpass-sable.vercel.app. Own Neon DB (host contains "wispy").
  FROZEN — bug fixes only.
- `platform` branch = Story Box — the multi-tenant company platform. Separate Neon DB
  (host contains "withered"). All active development.

RULE: when switching branches, switch DATABASE_URL in .env to match.
Backups: .env.wedding.backup and .env.platform.backup (both gitignored).

## Stack
Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind · Framer Motion ·
Prisma 6 + Neon Postgres · Vercel · html5-qrcode · qrcode.react · bcryptjs

## Roles (all four built)
- planner — creates/runs events. Full console.
- host/client — the couple. Own dashboard at /e/[slug]/host: countdown, stats,
  arrivals ring, seating, gift tracker.
- guest — registers via link (no account needed). Optional account shows all their events.
- vendor — suppliers (DJ, caterer). Teal badge, call time, brief, scans in on arrival.

## The pass lifecycle
pending (silver) -> approved (gold) -> checked-in online (emerald) -> scanned at gate.
Single-use: second scan shows ALREADY USED with first-scan time.
Guests can decline attendance; declined guests excluded from head counts.

## Access model
- Each event auto-generates its own ADM-XXXXXX (host terminal) and GATE-XXXXXX (scanner).
  Stored in sessionStorage per event so one entry unlocks admin/seating/vendors/host.
- Staff tiers: owner (set by OWNER_EMAIL in .env, cannot be removed) > admin > reviewer.
- Events start `approval: pending` and are DORMANT until staff activate them at /staff.
  Business model: client pays planner; Story Box staff activate the event.

## Routes
Public:    /  /login  /signup
Planner:   /dashboard  /dashboard/new  /dashboard/trash
           /dashboard/[slug]  + /website /invite /settings
Event:     /e/[slug]  /rsvp  /mypass  /pass/[passId]
           /admin  /scan  /seating  /vendors  /host  /live
Staff:     /staff
API note:  /api/events/get?slug= returns a single event for its owner
           (created 24 Jul — settings page depends on it).

## Design system (IMPORTANT — do not use flat boxes)
All depth utilities are in src/app/globals.css:
sb-surface, sb-lift, sb-panel, sb-cream, sb-btn, sb-btn-gold, sb-ghost, sb-input,
sb-icon, sb-badge, sb-shimmer, sb-sheen, sb-figure, sb-row, sb-display, sb-eyebrow,
sb-glow-warm, sb-glow-green.
Palette: bg #080807 · cream #f5f1ea · gold #c9a227 · green #1c4634 · vendor teal #5eead4.
Fonts: Cormorant Garamond (serif, headlines) + Inter (sans, UI).
Feel target: Apple-like depth — inset highlights, layered shadows, recessed inputs.
NEVER ship a flat card.
PER-EVENT COLOUR: Event.accentColor themes the public event site (/e/[slug]) —
tagline, glow, icons, bank panel. Default #c9a227 keeps the house look. The platform
UI itself (dashboard, staff, landing) stays in the house palette always.

## Structured data rules (client-driven, for analytics)
- eventType: dropdown only (Wedding, Traditional Wedding, Birthday, Conference,
  Corporate Event, Brand Launch, Concert, Church Program, Gala / Awards,
  Private Dinner, Funeral / Memorial, Other). Auto-suggests the tagline.
- state: compulsory dropdown, 36 Nigerian states + FCT Abuja.
- Dates/times: native pickers writing eventDateISO + pretty eventDate.
- WHY: /staff aggregates events+guests byType and byState (tallyBy in
  api/staff/overview). Free text would corrupt the analytics. Keep it structured.

## Hard-won gotchas
- PowerShell treats [ ] as wildcards. For paths with [slug] use
  [System.IO.File]::ReadAllText/WriteAllText or write to a temp path then Move-Item.
- Errors pointing at .next/ are stale cache. Remove-Item -Recurse -Force ".next" and rebuild.
- Chat paste sometimes eats `<a` and `useState<`. Prefer next/link `<Link>`.
- backdrop-filter creates a containing block — modals inside .sb-surface must use
  createPortal to document.body or they break.
- Neon free tier sleeps; first query can take 2-3s. DATABASE_URL needs
  &connect_timeout=30&connection_limit=5&pool_timeout=30
- Prisma 6 only (v7 changed schema config format).
- Hydration mismatch errors right after a rebuild are usually a stale browser tab —
  Ctrl+Shift+R before treating them as real bugs.
- The user pasting terminal output back into the terminal (or copying over the
  clipboard after `| clip`) has happened repeatedly — harmless, but re-run the clip.
- Links containing YOUR-SLUG / THAT-SLUG are placeholders; the user has pasted them
  literally more than once. Prefer navigation via /dashboard.

## How to work with me
Give me PowerShell blocks I can paste, not manual file edits.
Full file rewrites over regex patches when a file is fragile.
Always end with: Remove-Item -Recurse -Force ".next"; npm run build
To pass files/output to the AI: write to a txt, `Get-Content file | clip`, then paste
straight into chat WITHOUT copying anything else in between.

## RULES FOR ANY AI ASSISTANT WORKING ON THIS PROJECT

This is a WORKING, TESTED product with a live deployment. It is not a prototype.
Twenty-plus hours of decisions are already baked in. Your job is to ADD, never to rebuild.

1. NEVER rewrite a file you have not read. Ask for it first.
2. NEVER "clean up", refactor, rename, or reorganise anything that already works.
   If something looks unusual, assume there was a reason and ask before changing it.
3. NEVER run `prisma migrate reset` or anything that drops data.
   Additive migrations only — new fields, new tables.
4. NEVER touch the `main` branch. That is the live wedding. All work happens on `platform`.
5. ALWAYS end a change with:
   Remove-Item -Recurse -Force ".next"; npm run build
   Do not consider work finished until the build is clean.
6. ALWAYS match the existing design system (sb-* classes in globals.css).
   Never introduce flat cards, new colour palettes, or a different font.
7. When editing files whose path contains [brackets], use
   [System.IO.File]::ReadAllText / WriteAllText, or write to a temp path then Move-Item.
8. The user works on Windows PowerShell. Give paste-ready blocks, not manual edit instructions.
9. Prefer full-file rewrites over regex patching when a file is fragile — patches have
   silently corrupted files on this project before. Snapshot first
   (Copy-Item file file.backup) when rewriting.
10. If unsure whether something exists, ask the user to run:
    Get-ChildItem -Recurse src -Include *.tsx,*.ts | Select-Object FullName
11. Verify every patch landed with Select-String before building. Empty output on a
    [slug] path means use -LiteralPath, not that the text is missing.

## WHAT ALREADY WORKS — DO NOT REBUILD
Auth with roles · multi-tenant events with per-event keys · staff approval tiers ·
guest registration + decline · three-stage passes · QR scanning with duplicate detection ·
table assignment at the gate · seating plan with auto-seat · import/export ·
event website builder · digital invitation generator (4 themes, per-theme accent dots,
event-colour option, live canvas redraw) · live arrivals board · host dashboard with
gift tracker · vendor hub with badges · soft delete + trash + restore · platform control
panel with revenue tracking + analytics by type/state · event colour system
(6 palettes + custom wheel + live name chip) · update-link (slug regen) with warning ·
RSVP party size in plain language with custom counts.

## STARTING A NEW SESSION — attach these
1. STORYBOX.md (this file)
2. prisma/schema.prisma (the complete data model)
3. Any file the new task touches

## DEPLOYMENT (live as of this session)
- Story Box platform: https://storybox-fawn.vercel.app
  Vercel project `storybox` -> branch `platform` -> Neon DB (host contains "withered")
  Env vars set in Vercel: DATABASE_URL, AUTH_SECRET, OWNER_EMAIL
  NOTE: local dev and the live site share the SAME withered DB — test events created
  locally appear live. Clean up test events (e.g. slug "that-slug") before demos.
- Wedding (EventPass): https://eventpass-sable.vercel.app
  Vercel project `eventpass` -> branch `main` -> Neon DB (host contains "wispy")
  DO NOT TOUCH.

Deploying = `git push` on the platform branch. Vercel builds automatically.
package.json has a `postinstall: prisma generate` step — required for Vercel builds.

## NAVIGATION SYSTEM
src/components/Nav.tsx exports: PageShell, BackLink, Crumbs, EventNav, BrandBar.
EventNav is the sliding gold pill bar across Guests / Seating / Vendors / Client view / Live.
Use it on every event-scoped page.

## SESSION NOTE — 24 Jul 2026 (client testing session, everything shipped + live)
- eventType dropdown with auto-tagline; saved on create, editable via manage,
  shown on dashboard cards + staff list.
- state: compulsory dropdown (36 + FCT) on create; editable in settings; API rejects
  missing state. Older events show "Unspecified" until set — expected.
- Date + time pickers writing eventDateISO/pretty strings (was already partly in).
- FIXED: settings page was silently broken — it fetched /api/events/get which never
  existed. Route created (owner-scoped, returns full editable field set incl.
  accentColor + state). Settings now loads/saves correctly.
- "Update link" button in settings: updateSlug action regenerates slug from current
  title (collision-safe), amber warning that old links die. Old slug 404s afterward —
  by design; sessionStorage keys are per-slug so admin key re-entry after rename is expected.
- Occasion line: live mini-preview on create form (tagline above title, exactly as it
  renders on site/invite/pass); settings label clarified.
- /staff: "Events by type" + "Events by state" panels (tallyBy in overview API —
  count + guests per bucket, all live DB, nothing hardcoded).
- accentColor system: settings section with 6 named palettes (Champagne Gold #c9a227,
  Emerald Estate #2f9e6e, Royal Plum #b78bc9, Midnight Navy #7ba7d9, Blush Romance
  #e8a0b4, Crimson Executive #d94f4f) + native colour wheel + live name chip
  (palette name or "Custom #HEX") + inline "Save colour" button painted in the picked
  colour + "not applied until you save" note. Public site /e/[slug] wears it.
- INVITATION DESIGNER (client's original ask): full-file rewrite. Each of the 4 themes
  (Midnight/Emerald/Ivory/Wine) has its own colour-dot picker overriding that theme's
  accent (bg/ink stay professionally paired on purpose — no unreadable combos).
  "Use my event colour" button + "Reset accent colours". Canvas redraws live.
  /api/e/invite now returns accentColor. Backup exists: invite-page.backup.tsx.
- Landing hero reworded to client's copy, stacked three lines:
  "Events, Reimagined." / "One Platform." / "Connected Experiences."
  + "Planner • Host • Guest • Vendor" line. Mobile size tuned to 8vw —
  STILL NEEDS a real-phone eyeball check.
- RSVP: "How many of you are coming?" — Just me / Me + 1..4 guests / More
  (custom input 6–20, self-clamping). Pass still shows Party of N.
- Removed literal duplicate Invitation button in SharePanel (line-based dedupe).
- Client (brand owner) tested everything personally across the session — thrilled.

## OPEN QUESTIONS FOR THE CLIENT
1. "Occasion line": rename to "Subtitle" everywhere, or delete the concept?
   (It's the small line above the title on site/invite/pass; type auto-fills it.)
2. Party size ceiling: keep 20, raise it, or unlimited?
3. Invitation: does he also want full background control per theme (custom theme
   builder), or are per-theme accents enough?

## STILL TO BUILD
souvenir tracking (Guest.souvenirTaken already in schema — NEXT UP; landing page
already promises "nobody collects twice") · photo uploads (currently URL-only; needs
storage decision: Vercel Blob vs Cloudinary vs UploadThing) · guest gallery uploads ·
offline scanner mode · wristband category surfaced on pass · planner aggregate stats ·
activity log for staff approvals · separate host key with narrower powers than admin ·
post-event report · colour picker on the CREATE form (currently settings-only) ·
verify scanner UI handles large partySize (e.g. Party of 18) correctly ·
clean test events from withered DB before client demos.

## BRACKET GOTCHA (4th variant found)
Get-Content and Select-String ALSO fail on paths containing [brackets] unless you use -LiteralPath.
So: New-Item, Set-Content, Get-Content, Select-String all need -LiteralPath or .NET equivalents.
A silent 'no output' from Select-String on a [slug] path does NOT mean the text is missing.