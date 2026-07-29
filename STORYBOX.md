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
NOTE: local dev and live share the SAME withered DB — test events created locally appear
live. Clean test accounts (+test/+live/+fix/+rot signups, "that-slug" events) before demos.

## Stack
Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind · Framer Motion ·
Prisma 6 + Neon Postgres · Vercel · html5-qrcode · qrcode.react · bcryptjs ·
@vercel/blob (image uploads) · resend (transactional email)

## Roles (all four built)
- planner — creates/runs events. Full console.
- host/client — the couple. Dashboard at /e/[slug]/host: countdown, stats, arrivals ring,
  seating, gift tracker.
- guest — registers via link (no account needed). Optional account shows their events.
- vendor — suppliers (DJ, caterer). Teal badge, call time, brief, scans in on arrival.

## The pass lifecycle
pending (silver) -> approved (gold) -> checked-in online (emerald) -> scanned at gate.
Single-use: second scan shows ALREADY USED with first-scan time.
Guests can decline; declined guests excluded from head counts.

## Access model
- Each event auto-generates ADM-XXXXXX (host terminal) and GATE-XXXXXX (scanner),
  stored in sessionStorage per event.
- Staff tiers: owner (OWNER_EMAIL in .env, cannot be removed) > admin > reviewer.
- Events start approval:pending, DORMANT until staff activate at /staff.
- OWNER_EMAIL is currently the DEVELOPER's email. Client (38Seconds, admin@38secondsevents.com)
  was added as ADMIN via /staff Team tab. Full owner transfer deferred to launch.

## Routes
Public:    /  /login  /signup
Planner:   /dashboard  /dashboard/new  /dashboard/trash
           /dashboard/[slug]  + /website /invite /settings
Event:     /e/[slug]  /rsvp  /mypass  /pass/[passId]
           /admin  /scan  /seating  /vendors  /host  /live
Staff:     /staff
Key APIs:  /api/events/get?slug= (single event for owner) · /api/upload (Vercel Blob
           client uploads) · /api/auth/signup (sends welcome email)

## Design system (IMPORTANT — do not use flat boxes)
Depth utilities in src/app/globals.css: sb-surface, sb-lift, sb-panel, sb-cream, sb-btn,
sb-btn-gold, sb-ghost, sb-input, sb-icon, sb-badge, sb-shimmer, sb-sheen, sb-figure,
sb-row, sb-display, sb-eyebrow, sb-glow-warm, sb-glow-green.
Palette: bg #080807 · cream #f5f1ea · gold #c9a227 · green #1c4634 · vendor teal #5eead4.
Fonts: Cormorant Garamond (serif) + Inter (sans). Feel: Apple-like depth. NEVER a flat card.
PLATFORM IS DARK by design — no light-mode toggle (would require re-theming ~40 files;
a wedding/event aesthetic is meant to be dark). Ivory invitation theme covers light needs.
PER-EVENT COLOUR: Event.accentColor themes the public event site (/e/[slug]). Default
#c9a227. Platform UI itself always stays house palette.
LOGO: white version at public/brand/logo-white.jpg, mounted on a cream (#f5f1ea) rounded
tile with sb-depth ("jeweler's badge") in ALL navs/headers/footers site-wide. logo-full.jpg
(has STORY BOX text) reserved for emails/invoices. Transparent PNG still wanted from designer.

## Structured data rules (client-driven, for analytics)
- eventType: dropdown only. "White Wedding" (renamed from "Wedding"), Traditional Wedding,
  Birthday, Conference, Corporate Event, Brand Launch, Concert, Church Program, Gala/Awards,
  Private Dinner, Funeral/Memorial, Other. Auto-fills tagline.
- state: compulsory dropdown, 36 states + FCT Abuja.
- Dates/times: native pickers -> eventDateISO + pretty eventDate.
- /staff aggregates byType & byState (tallyBy in api/staff/overview). Keep it structured.

## Occasion line / tagline
The small line above the event title (site/invite/pass). Input field REMOVED from create &
settings per client. Now auto-set silently from event type. Do not re-add a visible field.

## Email (Resend) — LIVE
- Domain storyboxnigeria.com bought on Namecheap, DNS verified in Resend (DKIM/SPF/MX/DMARC).
- Sends from "Story Box <hello@storyboxnigeria.com>".
- src/lib/mailer.ts -> sendWelcomeEmail(to, name, role), called in signup route.
- Email failures NEVER block signup (wrapped in try/catch, guarded by `if(!key)return`).
- RESEND_API_KEY must be in .env, .env.platform.backup, AND Vercel env (Production) — and
  the FULL key (36 chars). A truncated paste (14 chars) silently broke live email once;
  debug via a temp console.log of key length was how we caught it.
- NEXT email opportunity: pass-confirmation emails on RSVP (door now open).

## Hard-won gotchas
- PowerShell treats [ ] as wildcards. For [slug] paths use [System.IO.File]::ReadAllText/
  WriteAllText, or -LiteralPath. Get-Content/Select-String/Set-Content/New-Item all need it.
- Errors pointing at .next/ are stale cache. Remove-Item -Recurse -Force ".next" and rebuild.
- backdrop-filter creates a containing block — modals inside .sb-surface need createPortal.
- Neon free tier sleeps; DATABASE_URL needs &connect_timeout=30&connection_limit=5&pool_timeout=30
- Prisma 6 only (v7 changed schema config format).
- Hydration mismatch right after a rebuild = stale browser tab. Ctrl+Shift+R before treating
  it as a real bug.
- Vercel env vars only apply to deployments built AFTER they're saved — always redeploy after
  changing one. Redeploy via Vercel ⋯ button OR an empty commit (git commit --allow-empty).
- Placeholders like YOUR-SLUG in links are fill-in-the-blanks; user has pasted them literally.
  Prefer navigating via /dashboard.
- Gmail +alias trick (you+test@gmail.com) = infinite unique signups to one inbox, for testing.

## How to work with me
Paste-ready PowerShell blocks, not manual edits. Full-file rewrites over regex on fragile
files (snapshot first: Copy-Item file file.backup). Verify every patch with Select-String
before building. Always end with: Remove-Item -Recurse -Force ".next"; npm run build.
To send files/output to the AI: write to a txt, `Get-Content file | clip`, paste straight
into chat without copying anything else in between.

## RULES FOR ANY AI ASSISTANT WORKING ON THIS PROJECT
This is a WORKING, TESTED, LIVE product. ADD, never rebuild.
1. NEVER rewrite a file you have not read. Ask for it first.
2. NEVER "clean up"/refactor/rename working code without asking.
3. NEVER prisma migrate reset or anything that drops data. Additive migrations only.
4. NEVER touch the main branch (live wedding). All work on platform.
5. ALWAYS end a change with Remove-Item -Recurse -Force ".next"; npm run build. Build clean = done.
6. ALWAYS match the sb-* design system. No flat cards, new palettes, or new fonts.
7. For [bracket] paths use .NET file methods or -LiteralPath.
8. Windows PowerShell — paste-ready blocks.
9. Full-file rewrites over regex on fragile files; snapshot first.
10. If unsure something exists, ask user to run a Get-ChildItem/Select-String check.
11. Verify each patch with Select-String before building.
12. Never spend money / buy services on the client's behalf without his explicit decision
    (domain, hosting, etc.) — those are his ownership/budget calls.

## WHAT ALREADY WORKS — DO NOT REBUILD
Auth with roles · multi-tenant events w/ per-event keys · staff approval tiers · owner-only
user deletion (typed DELETE confirm + cascade warning) · guest registration + decline ·
RSVP party size ("Just me / Me + N guests / More" custom 6-20) · three-stage passes ·
QR scanning w/ duplicate detection · table assignment at gate · seating plan w/ auto-seat ·
import/export · event website builder w/ REAL image uploads (logo/cover/gallery via Vercel
Blob, previews, remove) · clickable link lists · hashtag in hero · digital invitation
designer (4 themes each w/ own accent dot + event-colour option + reset + Word-style text:
bold/italic/underline + 3 fonts, live canvas render, PNG download) · live arrivals board ·
host dashboard w/ gift tracker · vendor hub · soft delete + trash + restore · platform
control panel w/ revenue + analytics byType/byState · event colour system (6 palettes +
custom wheel + live name chip) · update-link (slug regen w/ warning) · cream-tile logo
site-wide · welcome email on signup (Resend, live).

## DEPLOYMENT
- Story Box platform: https://storybox-fawn.vercel.app — Vercel project `storybox` ->
  branch `platform` -> Neon "withered". Env: DATABASE_URL, AUTH_SECRET, OWNER_EMAIL,
  RESEND_API_KEY, BLOB_READ_WRITE_TOKEN (+ BLOB_STORE_ID, BLOB_WEBHOOK_PUBLIC_KEY).
- Wedding (EventPass): https://eventpass-sable.vercel.app — project `eventpass` ->
  branch `main` -> Neon "wispy". DO NOT TOUCH.
- storyboxnigeria.com: bought (Namecheap), used for EMAIL only so far. NOT yet pointed at
  the website (that's a separate Vercel domain + 2 DNS records setup if wanted).
- Deploy = git push on platform. postinstall: prisma generate (required for Vercel builds).

## NAVIGATION
src/components/Nav.tsx exports PageShell, BackLink, Crumbs, EventNav, BrandBar.
EventNav = sliding gold pill bar across Guests/Seating/Vendors/Client view/Live.

## OPEN QUESTIONS FOR CLIENT
1. Event-site logo placement: nav bar / centered above title / both? (his design musing)
2. Party size ceiling: keep 20, raise, or unlimited?
3. Point storyboxnigeria.com at the website too (not just email)?
4. Full owner transfer (OWNER_EMAIL) to him — do at launch.

## STILL TO BUILD
souvenir tracking (Guest.souvenirTaken exists — NEXT UP; "nobody collects twice" already
promised on landing) · offline scanner mode · wristband category surfaced on pass · planner
aggregate stats · activity log for staff approvals · post-event report · pass-confirmation
emails (email infra now ready) · transparent-PNG logo when designer provides it · optional:
website at storyboxnigeria.com domain.

## SESSION LOG — 24-26 Jul 2026 (huge multi-day sprint, client testing live throughout)
Day 1: eventType · compulsory state · date/time pickers · FIXED silently-broken settings
(missing /api/events/get) · update-link button · occasion-line preview · staff analytics
byType/byState · accentColor system (6 palettes + wheel + chip) · landing hero reworded &
stacked 3 lines · RSVP plain-language party size + custom · removed duplicate Invitation btn ·
per-theme invitation accent dots + event-colour + Word-style text editor.
Day 2-3: White Wedding rename (+ DB migration of existing rows) · occasion field removed
(auto from type) · clickable hotel/restaurant/funspot links · ceremony venue removed (maps
kept) · hashtag in hero · REAL image uploads via Vercel Blob (logo/cover/gallery) · card
text overflow fix · "Events you are attending" clarified + excludes own events · owner-only
delete-user · client added as admin · cream-tile logo site-wide · FULL EMAIL: bought
storyboxnigeria.com, DNS, Resend, welcome email live (debugged a truncated-key issue),
rotated key after exposure. Client thrilled throughout.
- NEVER use greedy multiline regex ((?s).*?) to replace functions in files with
  multiple similar functions — it silently ate half a file once and cost an hour
  of shrapnel-fixing. Line-number surgery or full-file rewrite only.
- A lone <a on its own line gets eaten by clipboard paste (happened again).
  Always write <a inline with its first attribute.
  ## SESSION NOTE — 27 Jul 2026
- HOST SYSTEM COMPLETE (client's big ask): Event.hostEmail in schema · "Host access" card
  in event Settings (invite by email) · branded "Claim my event" email via Resend ·
  /api/me/events returns `hosting` list · MyEvents.tsx renders "Events you are hosting"
  cards · /api/e/host auto-unlocks (no ADM key) when signed-in email matches hostEmail
  or user owns the event. Full flow tested live end-to-end. ✅
- Invitation designer: TWO pickers only (Background + Text) with WCAG auto-contrast,
  rainbow "Custom" ring vs named preset swatches with ✓. Footer collision guard
  (safeBottom H-240) — overlap bugs dead.
- Hotels/Restaurants/FunSpots: structured Name+Link rows in editor ("+ Add another"),
  named "View map ↗" cards on the site (Name | URL line format, backwards compatible).
- Milk favicon. Location cards. Event page survived a regex war and was rebuilt healthy.
- HARD LESSONS ADDED: (1) never greedy multiline regex on files with similar functions —
  line-number surgery or full rewrite only. (2) always re-pull a file fresh before
  patching; a stale paste caused every failed anchor today. (3) dashboard/page.tsx is a
  97-line server shell; the client logic lives in src/components/MyEvents.tsx.
- STILL OPEN: unified nav bar (deferred, design with host flow bedded in) · admin swap
  (needs admin@storyboxnigeria.com account first) · souvenir tracking next · OG image
  for WhatsApp link previews · transparent logo PNG from designer.
  ## SESSION NOTE — 28 Jul 2026
- KEYLESS EVENT MANAGEMENT (client voice note): new src/lib/eventAccess.ts →
  canManageEvent(event, key) = valid ADM key OR signed-in owner OR signed-in invited
  host. Wired into /api/e/admin (GET+POST), /api/e/seating, /api/e/vendors.
  Front-end admin/seating/vendors pages now try load("") on mount (session attempt)
  before showing the key screen; empty-key failure falls back silently. Tested live:
  owner keyless ✓ invited host keyless ✓ strangers gated ✓ usher keys unchanged ✓.
- Staff panel blind-spot fix (27 Jul): Planners tab was filtering to planner/host roles
  only — vendors/guests invisible (caused the vibecheque mystery; account found via
  Prisma forensics, deleted by script). Now shows ALL accounts.
- Admin swap done: admin@storyboxnigeria.com = admin, 38Seconds removed, owner unchanged.
- PlacesEditor: state-based rows (spaces + Add-another bugs fixed). TBA seat labels.
  Story Box milk logo fallback on passes. Host-invite success message.
- LESSON: sessionStorage key-gate pages need session-first entry; pattern reusable.
STILL OPEN: souvenir tracking · password reset (no forgot-password exists!) · role
switcher · unified nav · OG image · test-account cleanup · storyboxnigeria@gmail.com
ownership unconfirmed.