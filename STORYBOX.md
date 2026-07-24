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

## Design system (IMPORTANT — do not use flat boxes)
All depth utilities are in src/app/globals.css:
sb-surface, sb-lift, sb-panel, sb-cream, sb-btn, sb-btn-gold, sb-ghost, sb-input,
sb-icon, sb-badge, sb-shimmer, sb-sheen, sb-figure, sb-row, sb-display, sb-eyebrow,
sb-glow-warm, sb-glow-green.
Palette: bg #080807 · cream #f5f1ea · gold #c9a227 · green #1c4634 · vendor teal #5eead4.
Fonts: Cormorant Garamond (serif, headlines) + Inter (sans, UI).
Feel target: Apple-like depth — inset highlights, layered shadows, recessed inputs.
NEVER ship a flat card.

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

## Still to build
post-event report · photo uploads (currently URLs only) · guest gallery uploads ·
souvenir tracking · offline scanner mode · wristband category on pass ·
host reports/exports · planner aggregate stats across events

## How to work with me
Give me PowerShell blocks I can paste, not manual file edits.
Full file rewrites over regex patches when a file is fragile.
Always end with: Remove-Item -Recurse -Force ".next"; npm run build

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
   silently corrupted files on this project before.
10. If unsure whether something exists, ask the user to run:
    Get-ChildItem -Recurse src -Include *.tsx,*.ts | Select-Object FullName

## WHAT ALREADY WORKS — DO NOT REBUILD
Auth with roles · multi-tenant events with per-event keys · staff approval tiers ·
guest registration + decline · three-stage passes · QR scanning with duplicate detection ·
table assignment at the gate · seating plan with auto-seat · import/export ·
event website builder · digital invitation generator · live arrivals board ·
host dashboard with gift tracker · vendor hub with badges · soft delete + trash + restore ·
platform control panel with revenue tracking.

## STARTING A NEW SESSION — attach these
1. STORYBOX.md (this file)
2. prisma/schema.prisma (the complete data model)
3. Any file the new task touches
