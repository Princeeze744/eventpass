# Event Experience Platform — Technical Handover

Technical documentation for the Event Experience Platform operated at
**storyboxnigeria.com**. This document is intended to enable a competent developer to
understand, operate, maintain and further develop the Platform independently.

---

## 1. Overview

A multi-tenant event management platform. Event organisers create events; guests
self-register through a public link and receive verified single-use digital passes;
ushers scan those passes at the gate.

**Four user roles**

| Role | Purpose |
|---|---|
| planner | Creates and runs events. Full event console. |
| host | The client whose event it is. Read-focused dashboard with live stats. |
| guest | Registers via a public link. No account required. |
| vendor | Suppliers (DJ, caterer, etc). Receives a badge with call time and brief. |

**Pass lifecycle**

```
pending  →  approved  →  checked in online (optional)  →  scanned at gate
```

Passes are single-use. A second scan of the same pass returns `duplicate` and displays
the time of the original scan.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| ORM | Prisma 6 |
| Database | Neon (PostgreSQL, serverless) |
| Hosting | Vercel |
| Email | Resend |
| File storage | Vercel Blob |
| QR scanning | html5-qrcode |
| QR generation | qrcode.react |
| Password hashing | bcryptjs |

> **Prisma version:** the project targets **Prisma 6**. Prisma 7 changed the schema
> configuration format and will require migration work. Do not upgrade without testing.

---

## 3. Repository Structure

```
src/
├── app/
│   ├── page.tsx                     Landing page
│   ├── layout.tsx                   Root layout, fonts, metadata, Open Graph
│   ├── globals.css                  Design system (all sb-* utility classes)
│   ├── login/  signup/              Authentication pages
│   ├── staff/                       Platform control panel (staff only)
│   ├── dashboard/
│   │   ├── page.tsx                 User dashboard (events owned + attending)
│   │   ├── new/                     Create event
│   │   ├── trash/                   Soft-deleted events
│   │   └── [slug]/
│   │       ├── page.tsx             Event console
│   │       ├── settings/            Event settings, colour, keys, host invite
│   │       ├── website/             Event website editor + image uploads
│   │       └── invite/              Digital invitation designer (canvas)
│   ├── e/[slug]/
│   │   ├── page.tsx                 Public event website
│   │   ├── rsvp/                    Guest registration
│   │   ├── mypass/                  Pass retrieval by phone number
│   │   ├── pass/[passId]/           Individual pass display
│   │   ├── admin/                   Guest management terminal
│   │   ├── seating/                 Seating plan
│   │   ├── vendors/                 Vendor hub
│   │   ├── host/                    Host dashboard
│   │   ├── live/                    Live arrivals board
│   │   └── scan/                    Gate scanner
│   └── api/                         All API routes (see section 5)
├── components/                      Shared React components
└── lib/
    ├── db.ts                        Prisma client singleton
    ├── auth.ts                      Session handling, password hashing
    ├── staff.ts                     Staff role resolution
    ├── ids.ts                       Pass ID generation, phone normalisation
    ├── mailer.ts                    Resend email templates
    └── eventAccess.ts               Event permission checks

prisma/
├── schema.prisma                    Data model
└── migrations/                      Migration history

public/brand/                        Logo assets
```

---

## 4. Data Model

Defined in `prisma/schema.prisma`. Five models:

**User** — accounts. Key fields: `email` (unique), `passwordHash`, `role`, `phone`,
`isStaff`, `staffLevel`, `suspended`.

**Event** — the core entity. Key fields: `slug` (unique, used in all public URLs),
`ownerId`, `hostEmail`, `title`, `eventType`, `state`, `eventDate`, `eventDateISO`,
`venue`, `accentColor`, `adminKey`, `usherKey`, `approval`, `paymentStatus`,
`deletedAt` (soft delete), plus website content fields (story, dressCode, hotels,
restaurants, funSpots, gallery, bankDetails and others).

**Guest** — one row per registered guest or vendor. Key fields: `passId` (unique),
`name`, `phone`, `status`, `rsvpAnswer`, `checkedIn`, `checkedInAt`,
`checkedInOnline`, `table`, `seat`, `isVendor`, `callTime`, `deletedAt`.
Unique constraint on `[eventId, phone]` prevents duplicate registration.

**SeatTable** — tables in the seating plan. Fields: `name`, `section`, `capacity`,
`position`.

**Gift** — gift tracker entries. Fields: `fromName`, `giftType` (cash or item),
`amount`, `item`, `thanked`.

> **Migrations are additive only.** Never run `prisma migrate reset` against
> production — it drops all data. Add new fields and tables; do not remove or rename
> existing ones without a data migration plan.

---

## 5. API Routes

All under `src/app/api/`.

**Authentication**
- `POST /api/auth/signup` — creates account, sets session cookie, sends welcome email
- `POST /api/auth/login` — authenticates, sets session cookie
- `POST /api/auth/logout` — clears session

**Event management (owner-scoped)**
- `POST /api/events` — create event
- `GET  /api/events/get?slug=` — fetch single event for its owner
- `POST /api/events/manage` — update, trash, restore, destroy, rotateKeys,
  updateSlug, inviteHost

**Event operations (key or session authenticated)**
- `/api/e/admin` — guest list and approvals
- `/api/e/guests` — guest data
- `/api/e/rsvp` — guest registration (public)
- `/api/e/mypass` — pass retrieval (public)
- `/api/e/verify` — gate scan verification
- `/api/e/checkin` — online self check-in
- `/api/e/decline` — guest declines attendance
- `/api/e/assign` — assign table at the gate
- `/api/e/seating` — seating plan CRUD and auto-seat
- `/api/e/vendors` — vendor CRUD and brief
- `/api/e/gifts` — gift tracker
- `/api/e/import` — bulk guest import
- `/api/e/export` — CSV export
- `/api/e/report` — CSV reports (rsvp, checkin, seating, gifts)
- `/api/e/stats` — live statistics
- `/api/e/host` — host dashboard data
- `/api/e/website` and `/api/e/website/get` — event website content
- `/api/e/invite` — invitation designer data

**Platform administration**
- `GET  /api/staff/overview` — all events, users, totals, analytics by type and state
- `POST /api/staff/review` — activate/suspend events, record payments, manage staff
  levels, delete users

**Other**
- `POST /api/upload` — Vercel Blob client upload token issuer
- `GET  /api/me/events` — events the signed-in user is attending or hosting
- `POST /api/me/link` — link a phone number to an account

---

## 6. Access Control

Three independent mechanisms:

**1. Session (account-based)**
Signed-in users authenticated by an httpOnly cookie. Handled by
`getSessionOrganizerId()` in `src/lib/auth.ts`.

**2. Event keys**
Each event generates two keys at creation:
- `adminKey` — format `ADM-XXXXXX`. Unlocks the guest terminal, seating and vendors.
- `usherKey` — format `GATE-XXXXXX`. Unlocks the gate scanner only.

Keys are cached per event in the browser's `sessionStorage`. They exist so that
ushers and event staff without platform accounts can be given scoped access.
Keys can be regenerated at any time from event settings (`rotateKeys`), which
immediately invalidates the previous keys.

**3. Ownership and host invitation**
`canManageEvent()` in `src/lib/eventAccess.ts` grants access to the event owner and
to any signed-in user whose email matches the event's `hostEmail`, without requiring
a key. The event management pages attempt session access first and only show the key
entry screen if that fails.

**Staff tiers** — resolved in `src/lib/staff.ts`:
- **owner** — the account whose email matches the `OWNER_EMAIL` environment variable.
  Cannot be removed or suspended. Sole ability to manage the staff team and delete
  user accounts.
- **admin** — activate/suspend events, record payments, suspend planners.
- **reviewer** — activate or hold events only.

**Event activation** — new events are created with `approval: "pending"` and are not
publicly visible until activated by staff at `/staff`.

---

## 7. Environment Variables

Required in Vercel (Production and Preview) and in `.env` for local development:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Session token signing secret |
| `OWNER_EMAIL` | Email address that holds platform owner rights |
| `RESEND_API_KEY` | Transactional email (welcome, host invitations) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob image uploads |
| `BLOB_STORE_ID` | Vercel Blob store identifier |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Vercel Blob webhook verification |

**Connection string note:** the Neon URL should include
`&connect_timeout=30&connection_limit=5&pool_timeout=30`. Neon's free tier suspends
idle databases, so the first query after a period of inactivity can take two to three
seconds.

> Environment variables are read at build time. After changing any variable in Vercel,
> a **redeploy is required** for the change to take effect.

---

## 8. Deployment

**Hosting:** Vercel, connected to the GitHub repository.
**Branch:** `platform` deploys to production.
**Domain:** storyboxnigeria.com (registered at Namecheap).

Deployment is automatic on every push to the `platform` branch. `package.json`
includes a `postinstall: prisma generate` step which is required for Vercel builds to
succeed.

**DNS configuration at Namecheap:**

| Type | Host | Value | Notes |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Points the root domain at Vercel |
| CNAME | `www` | `<project>.vercel-dns-017.com` | Points www at Vercel |
| TXT | `resend._domainkey` | DKIM key | Email authentication |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) | Email |

The Mail Settings section in Namecheap must be set to **Custom MX** for the MX record
to be available.

**Local development:**

```bash
npm install
npm run dev          # development server on localhost:3000
npm run build        # production build — must pass before deploying
npx prisma studio    # browse the database in a GUI
```

After schema changes:

```bash
npx prisma migrate dev --name descriptive_name
```

---

## 9. Design System

All visual utilities are defined in `src/app/globals.css` as `sb-*` classes:

`sb-surface` `sb-lift` `sb-panel` `sb-cream` `sb-btn` `sb-btn-gold` `sb-ghost`
`sb-input` `sb-icon` `sb-badge` `sb-shimmer` `sb-sheen` `sb-figure` `sb-row`
`sb-display` `sb-eyebrow` `sb-glow-warm` `sb-glow-green` `sb-sticky` `sb-hairline`

**Palette**

| Purpose | Value |
|---|---|
| Background | `#080807` |
| Cream / light text | `#f5f1ea` |
| Gold accent | `#c9a227` |
| Deep green | `#1c4634` |
| Vendor teal | `#5eead4` |

**Typography:** Cormorant Garamond (serif, headings) and Inter (sans, interface),
loaded via `next/font` and exposed as `--font-serif` and `--font-sans`.

**Per-event colour:** `Event.accentColor` themes the public event page — tagline,
divider, ambient glow, section icons and the gifting panel. Default `#c9a227`. The
platform's own interface always uses the house palette regardless of event colour.

**Design intent:** surfaces are layered with inset highlights and soft shadows.
Avoid flat, borderless cards — use `sb-surface` with `sb-lift` for interactive
elements.

---

## 10. Key Features and Where They Live

**Guest registration** — `e/[slug]/rsvp/page.tsx` → `api/e/rsvp`. One registration
creates one guest with one pass. Duplicate phone numbers on the same event are
rejected.

**Bulk import** — `components/ImportPanel.tsx` → `api/e/import`. Accepts pasted text
or a CSV/TXT upload. Format: `Name, Phone, Category, Party Size` — one guest per line,
only Name required. Duplicates are skipped by phone or name. Optional "approve
immediately" flag.

**Gate scanner** — `e/[slug]/scan/page.tsx` → `api/e/verify`. Camera scanning with
manual pass-ID entry as fallback. Full-screen colour-coded result: green (welcome),
amber (already used, with original scan time), grey (not approved), red (not on list).
Includes an inline table assignment field.

**Seating plan** — `e/[slug]/seating/page.tsx` → `api/e/seating`. Create tables
individually or in bulk, assign guests manually, or use auto-seat which fills tables
by capacity in tier order. Print-friendly stylesheet included.

**Invitation designer** — `dashboard/[slug]/invite/page.tsx`. HTML canvas rendering at
1080×1350. Background and text colours are chosen independently, with the text colour
auto-selected for contrast using WCAG relative luminance (`bestTextFor()`). Invitation
wording supports bold, italic and underline via inline markers (`**`, `*`, `~`) parsed
by `parseStyled()` and rendered as styled canvas text runs. Exports to PNG.

**Image uploads** — `dashboard/[slug]/website/page.tsx` → `api/upload`. Uses Vercel
Blob client uploads (not server uploads), so the 4.5 MB server limit does not apply.
Restricted to image MIME types, 8 MB maximum, authenticated via session.

**Email** — `lib/mailer.ts`. Two templates: welcome on signup, and host invitation.
Both are wrapped in try/catch so that an email failure never blocks the underlying
action.

**Host invitation flow** — a planner enters a host email in event settings
(`inviteHost`). The email is stored on `Event.hostEmail` and a branded invitation is
sent. When that email signs in, `api/me/events` returns the event in its `hosting`
list, it appears on their dashboard, and `canManageEvent()` grants keyless access to
the host view.

**Platform analytics** — `api/staff/overview`. `tallyBy()` aggregates events and guest
counts by event type and by state. All figures are computed live from the database.

---

## 11. Operational Notes

**Structured data matters.** Event type and state are dropdowns rather than free text
specifically so that the platform analytics (events by type, events by state) remain
meaningful. Keep them structured.

**Slugs are stable.** An event's slug is generated from its title at creation and does
not change when the title is edited, so that invitations already shared keep working.
Settings includes an explicit "Update link" action which regenerates the slug and
warns that existing links will stop working.

**Soft deletes.** Events and guests use `deletedAt` rather than hard deletion, which
is what powers the trash and restore features. User deletion, by contrast, is a hard
delete and cascades to that user's events and those events' guests.

**Session storage keys.** Event keys are cached per event slug in `sessionStorage`.
If an event's slug changes, previously cached keys will not be found and must be
re-entered.

**Deleting a user is destructive.** It removes their events and all guests on those
events. Always check the event count on an account before deleting it.

---

## 12. Troubleshooting

| Symptom | Cause and resolution |
|---|---|
| Build errors referencing `.next/` | Stale build cache. Delete the `.next` directory and rebuild. |
| Hydration mismatch immediately after a rebuild | Stale browser tab holding pre-rebuild HTML. Hard refresh (Ctrl+Shift+R). |
| Emails not sending in production | `RESEND_API_KEY` missing, truncated, or the deployment predates the variable being set. Verify the full key is present and redeploy. |
| First database query slow | Neon free tier suspends idle databases. Expected; subsequent queries are fast. |
| Modal renders behind other content | `backdrop-filter` creates a containing block. Modals inside `.sb-surface` must be portalled to `document.body` with `createPortal`. |
| Uploads failing | `BLOB_READ_WRITE_TOKEN` missing in the environment, or the file exceeds 8 MB / is not an image. |
| Link preview shows an outdated image | WhatsApp and other platforms cache Open Graph data. Append a query string to force a fresh fetch. |

---

## 13. Suggested Next Development

Items scoped but not yet built:

- Souvenir tracking — `Guest.souvenirTaken` exists in the schema; a second scan
  checkpoint at the souvenir table would prevent duplicate collection.
- Offline scanner mode — cache the guest list locally so gate verification works
  without a network connection, syncing when it returns.
- Password reset — no forgot-password flow currently exists; Resend is already
  configured and would support it.
- Account role switching — the role chosen at signup is largely a label; allowing it
  to be changed would remove a recurring source of user confusion.
- Wristband category surfaced on the pass — the `Guest.wristband` field exists but is
  not displayed.
- Per-event Open Graph images so that shared event links preview with the event's own
  title and cover photo.
- Bulk SMS or WhatsApp distribution of registration links (requires a messaging
  provider and carries a per-message cost).

---

*Prepared as part of the platform handover.*
