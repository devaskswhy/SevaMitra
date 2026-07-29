# SevaMitra — Portfolio Flagship Roadmap

**This is a rewrite of the original roadmap, produced by re-auditing the
repo after Phases 1 and 2 below were actually implemented and pushed to
`master`.** Phases 1 and 2 are marked done with their commit hashes and
kept only as a historical record — don't re-run them. Phases 3 onward are
current, freshly verified against the live deploy, and are what's actually
left. Each phase is still a **self-contained prompt** — copy the whole
"Prompt for Claude Code" block into a fresh session to execute that phase
in isolation.

## 🔴 Read this first — the live deploy is currently broken

While re-auditing for this rewrite, I drove the actual production site
(`https://seva-mitra-wheat.vercel.app`) with a browser and captured real
network traffic. **Every data-fetching page is broken in production right
now:**

```
GET https://sevamitra-1.onrender.com/api/volunteers  → 400
GET https://sevamitra-1.onrender.com/api/zones       → 400
GET https://sevamitra-1.onrender.com/api/incidents   → 400
GET https://sevamitra-1.onrender.com/api/tasks       → 400
GET https://sevamitra-1.onrender.com/api/assignments → 400
GET https://sevamitra-1.onrender.com/api/shifts      → 400
Body on every one: {"success":false,"error":"Database error: P2021"}
```

Prisma error `P2021` means **the table does not exist in the connected
database.** The Express server itself is healthy (`/health` returns `200
ok`) — this isn't a code bug, it's that the production Postgres database
(whatever `DATABASE_URL` Render's environment currently points at) was
never migrated/seeded, or points at an empty database. The homepage
*looks* fine when you land on it because `apps/web/app/page.tsx` has a
hardcoded `FALLBACK_*` data path that silently masks total API failure —
but click into `/dashboard`, `/zones`, `/incidents`, `/reports`,
`/volunteers`, or try to register, and it's all dead. **This is the
single highest-leverage fix available and is Phase 3, item 1, below** —
higher priority than any visual work, because no amount of design polish
matters if a recruiter clicks past the homepage and hits an empty app.

Separately, production also throws real React hydration errors (minified
`#425`/`#418`/`#423`) on every page that renders `components/TopBanner.tsx`
— confirmed on `/register` and `/volunteers`, and by inspection of the
component, present on `/dashboard`, `/zones`, `/incidents`, `/reports` too
(anywhere `<TopBanner />` is used). Root cause: `TopBanner.tsx` seeds a
live clock with `useState(new Date())`, so the server-rendered timestamp
and the client's first-paint timestamp differ, and React discards the
server HTML for that subtree. Also covered in Phase 3.

## Status

| Phase | What | Status |
|---|---|---|
| 1 | Bug/glitch fix pass (endpoint contracts, undefined CSS tokens, dead chat backend, hardcoded registration data, PWA icons, CSV export, loading/error states, repo hygiene) | ✅ Done — `940b8c3`, merged with upstream incident-deploy work at `48ed272` |
| 2 | Design system consolidation (type scale, spacing scale, single color-token source, motion tokens, `Button`/`Card`/`Badge`/`Modal` primitives) | ✅ Done — `bc5c1b4`, dot-indicator regression fixed at `69831a2` |
| 3 | **Restore production + close what Phase 1/2 didn't reach** | ⬅ Do this next |
| 4 | Signature UI/UX pass (finish primitive rollout, motion, editorial polish) | Pending |
| 5 | New feature depth (auth/RBAC or shift scheduling) | Pending |
| 6 | Performance & real-time robustness | Pending |
| 7 | Accessibility hardening (full audit) | Pending |
| 8 | Resume-readiness (README, tests, CI, case study) | Pending |
| 9 | Final QA + deploy | Pending |

Also worth knowing going in: an external PR (`copilot/update-incident-
deployment-system`, merged as `736dfef` before I could push Phase 1) added
a genuinely solid feature you should NOT try to rebuild — `POST
/api/incidents/:id/deploy` now does real server-side volunteer matching
(skill + reliability + workload), creates the task/shift/assignment
records, sets an `Incident.status` field (`ACTIVE`/`DEPLOYED`/`RESOLVED`),
auto-resolves incidents on a timer with `Socket.io` events
(`incident:deployed`, `incident:resolved`, `incident:new`), and the
homepage already has toast notifications + a pulse-highlight animation for
it. This is real, working, and is exactly the kind of "real-time
robustness" Phase 6 below would otherwise have asked for — don't
duplicate it.

---

## Phase 1 (done) — Bug & Glitch Fix Pass

Fixed 16 confirmed defects: undefined CSS custom properties breaking
`/dashboard`/`/zones`/`/incidents`/`/reports`/`/volunteers`/`/register`,
the allocation-recommendation and incident-deploy endpoints calling
contracts that didn't exist, a hardcoded `localhost:4000` socket URL in
production, the volunteer check-in/out contract mismatch, a missing
`/api/shifts` route, an orphaned Express/Anthropic/Redis chat backend
with no frontend caller, hardcoded fake registration data, missing PWA
icons, a fake CSV export `alert()`, missing loading/error states, and
repo hygiene (stray root images, duplicate seed file). See commit
`940b8c3` for the full diff and `48ed272` for how it was reconciled with
the concurrently-merged incident-deploy PR.

## Phase 2 (done) — Design System Consolidation

Replaced three competing/partially-undefined visual systems with one:
a formal type scale (`--text-xs` through `--text-display`, 8 steps), a
4px-based spacing scale (`--space-1` through `--space-32`, numerically
matching Tailwind's own scale), a single color-token source (`tailwind.
config.ts` now references the `globals.css` CSS vars instead of
duplicating hex — this caught a real bug, `tailwind.config.ts`'s
`deep-brown` was a different, unused hex value from the CSS var of the
same name), motion tokens, and four new primitives in `apps/web/
components/ui/`: `Button`, `Card`, `Badge` (with `severityToBadge`/
`priorityToBadge`/`statusToBadge` helpers), and `Modal` (the app's first
— focus trap, Escape, click-outside). Migrated `page.tsx`, `dashboard/
page.tsx`, `zones/page.tsx`, `incidents/page.tsx` onto the primitives.
Zero hardcoded hex remains in `volunteer/**/*.tsx`. `--text-muted`'s
contrast was measured at ~3:1 (fails WCAG AA) and raised to ~5.1:1. See
commit `bc5c1b4`.

**Known gap left for Phase 4:** `reports/page.tsx`, `volunteers/page.tsx`,
`register/page.tsx`, and all four `volunteer/*` mobile pages still don't
use the new `Button`/`Card`/`Badge` primitives — they use the *tokens*
(colors/spacing/type are consolidated everywhere) but still hand-roll
their own badge/card/button markup. Phase 2's own acceptance criteria
only required the two highest-traffic pages; finishing the rollout is
explicitly Phase 4's job, not a Phase 2 miss.

**A regression this surfaced, already fixed:** Phase 2's global `button {
min-height: var(--tap-target) }` (48px, for the project's own stated
touch-target goal) stretched the homepage's decorative hero-carousel dot
indicators into large rectangles, since they're plain `<button>`s with no
override. Fixed with a scoped `minHeight`/`minWidth` override on that one
component (`69831a2`) — mentioned here because it's a pattern worth
checking for elsewhere: any small icon-only or decorative `<button>`
added without an explicit size override will silently inherit the 48px
floor.

---

## Phase 3 — Restore Production + Close What Phase 1/2 Didn't Reach

**Goal:** the live deploy actually works end-to-end again, and the two
concrete bugs found while re-auditing for this rewrite are fixed. This is
a short, urgent phase — do it before any more visual work, since visual
polish on a database-less app is wasted effort.

### Prompt for Claude Code

```
Two confirmed, verified bugs need fixing in the SevaMitra repo. Do NOT
redesign anything or touch the design system/primitives from Phase 2 —
this is a correctness-only pass, same spirit as Phase 1.

1. PRODUCTION DATABASE HAS NO SCHEMA: I drove the live site
   (https://seva-mitra-wheat.vercel.app) with a browser and captured the
   actual network traffic. The frontend calls
   https://sevamitra-1.onrender.com/api/* (this is the real production
   API host — NOT the Railway URL that appears in some local .env files,
   which is stale/decommissioned). Every data endpoint
   (/api/volunteers, /api/zones, /api/incidents, /api/tasks,
   /api/assignments, /api/shifts) returns HTTP 400 with body
   {"success":false,"error":"Database error: P2021"}. Prisma code P2021
   means the table doesn't exist in the connected database — the
   production Postgres has never been migrated/seeded, or DATABASE_URL
   on Render points somewhere empty. The API server itself is healthy
   (GET /health returns 200) so this is purely a data-layer problem.

   Fix: run `npx prisma db push --schema=prisma/schema.prisma` followed
   by `npx prisma db seed --schema=prisma/schema.prisma` against
   whatever DATABASE_URL Render's production environment actually has
   configured. This requires the real production DATABASE_URL as a
   credential I don't have and you shouldn't guess — if you (the person
   running this session) have it, supply it as a one-off shell
   environment variable when running those two commands (never write it
   to any file, never commit it, don't put it in apps/api/.env). If you
   don't have Render dashboard/env access in this session, stop after
   confirming the diagnosis above and tell me exactly what command needs
   to be run and by whom — don't guess at credentials or try alternate
   database hosts.

   Once schema+seed are applied, re-verify by re-driving the live site
   the same way this bug was found (a headless-browser network capture
   of /dashboard, /zones, /incidents, /reports, /volunteers, /register —
   confirm all six show 200s with real data, not 400s).

2. TOPBANNER HYDRATION MISMATCH: apps/web/components/TopBanner.tsx seeds
   a live clock with `useState(new Date())` and renders it immediately.
   Because this evaluates once during SSR (at server-render time) and
   again during client hydration (a moment later), the timestamps
   mismatch and React throws a hydration error, discarding and
   re-rendering that subtree. Confirmed via production console: minified
   React errors #425/#418/#423 fire on every page that renders
   <TopBanner /> (verified on /register and /volunteers; by code
   inspection this also affects /dashboard, /zones, /incidents,
   /reports, since they all use the same component). Fix by not
   rendering the live clock value until after mount — e.g. seed the
   state as `null`, set the real Date in a useEffect that only runs
   client-side, and render a static placeholder (or nothing) until then.
   This is the same category of bug, and same fix pattern, you'd use for
   any client-only value (matches how other date-sensitive rendering in
   this codebase should be handled — don't introduce a new pattern,
   keep it minimal).

ACCEPTANCE CRITERIA:
- Live production /dashboard, /zones, /incidents, /reports, /volunteers
  all render real seeded data (zone names, volunteer names, etc.), not
  empty states or fallback data.
- Browser console on every page listed above shows zero React hydration
  errors (#425/#418/#423 or any other "did not match" warning).
- No change to any file under apps/web/components/ui/ or any Phase 2
  token in globals.css/tailwind.config.ts.

DO NOT in this phase: touch visual design, add features, or change any
API route's business logic. If the production DATABASE_URL isn't
available to you, do item 2 and clearly report item 1's status rather
than skipping the whole phase.
```

---

## Phase 4 — Signature UI/UX Pass + Finish the Primitive Rollout

**Goal:** apply real craft and intentional motion to the pages that don't
already have it, using the token system + primitives Phase 2 built —
`apps/web/app/page.tsx` is already close to the mountstreetprinters.com
reference quality (full-bleed parallax hero, GSAP ScrollTrigger reveals,
count-up stats, consistent dark palette); everything else should come up
to that bar. This also finishes migrating the pages Phase 2 explicitly
left out.

### Prompt for Claude Code

```
apps/web/app/page.tsx already has a genuinely strong cinematic identity
(see apps/web/app/globals.css and apps/web/lib/scroll.ts for the GSAP/
Lenis setup already proven there). Reference: mountstreetprinters.com for
the level of craft (cinematic imagery, editorial confidence, generous
whitespace, restrained scroll motion) — page.tsx is already directionally
there; dashboard and the admin/volunteer pages are not. Assume Phases 1-3
have run (bugs fixed, one token system + Button/Card/Badge/Modal exist in
apps/web/components/ui/, production database restored).

1. FINISH THE PRIMITIVE ROLLOUT: apps/web/app/reports/page.tsx,
   volunteers/page.tsx, register/page.tsx, and all four volunteer/*
   mobile pages (volunteer/page.tsx, volunteer/home/page.tsx,
   volunteer/profile/page.tsx, volunteer/report/page.tsx) still
   hand-roll their own badge/card/button markup instead of using the
   components/ui/Badge, Card, and Button primitives Phase 2 built (they
   DO already use the shared color/spacing/type tokens — just not the
   components). Migrate them. Use Badge's severityToBadge/
   priorityToBadge/statusToBadge helpers where they apply instead of
   re-deriving tone logic per page.

2. DASHBOARD (/dashboard) AND ADMIN PAGES (/zones, /incidents,
   /volunteers, /reports): these still read as a generic admin
   template — static grids, minimal motion beyond a CSS hover. Add
   staggered entrance animations for card grids on scroll/mount (reuse
   the GSAP patterns already proven in page.tsx's stats section — don't
   introduce a second animation library; framer-motion is already a
   dependency used only by the currently-unused apps/web/components/
   ui/SacredHeader.tsx, PageTransition.tsx, and VolunteerBadge.tsx —
   confirm via grep whether those are actually wired into any route
   before deciding whether to standardize on GSAP or actually adopt
   framer-motion for this pass; don't run both approaches side by side
   in new code).

3. VOLUNTEER MOBILE FLOW: this is the highest-stakes UX in the app
   (older, possibly first-time smartphone users, in bright outdoor
   daylight, completing time-critical tasks). Elevate with intentional
   but RESTRAINED motion — this audience does not benefit from cinematic
   parallax. Prioritize clear state transitions (OTP sent -> OTP entry
   should feel continuous, not a jarring form swap) and a satisfying
   success state for check-in/check-out (the existing checkmark success
   state in volunteer/report/page.tsx is a good reference quality to
   extend to check-in/out).

4. HERO/LANDING MOMENT: page.tsx's hero is strong but static beyond the
   image crossfade. Add one signature interaction that isn't already
   there — keep additions minimal and intentional, the brief is
   "confident," not "more."

5. NAVBAR AUDIT: apps/web/components/ui/SacredHeader.tsx and
   PageTransition.tsx exist but (confirm via grep) are not imported
   anywhere in apps/web/app — they're dead code from an earlier
   iteration, superseded by components/TopBanner.tsx + Sidebar.tsx. If
   confirmed unused, either delete them or actually wire PageTransition
   into the app router layout for real page-transition motion between
   sidebar navigation (the latter is more valuable — a real page
   transition is currently missing entirely from the multi-page admin
   section).

ACCEPTANCE CRITERIA:
- Zero hand-rolled badge/card/button markup remains in reports.tsx,
  volunteers.tsx, register.tsx, or volunteer/**/*.tsx — all use the
  Phase 2 primitives.
- Every major admin page has at least one deliberate scroll- or
  mount-triggered reveal animation.
- The volunteer mobile flow's motion is deliberately calmer than the
  desktop marketing experience.
- SacredHeader.tsx and PageTransition.tsx are either deleted or actually
  used — not left as orphaned dead code either way.
- Lighthouse performance score on / does not regress by more than 5
  points from a baseline taken before starting.

DO NOT in this phase: add new features, new data, new routes, or touch
API/backend business logic. Do not re-theme away from the dark saffron/
gold/deep-brown identity.
```

---

## Phase 5 — New Feature Depth

**Goal:** add genuinely relevant depth that isn't already present, fit to
the existing data model. The live zone map (Leaflet-based) is already
implemented. The incident auto-deploy/resolve/socket system (merged
externally, see Status section above) already covers real-time ops depth.
The two most clearly underserved areas, backed by existing-but-unused
schema/infra, remain **real authentication/role-based access** and
**shift scheduling** (the `Shift` model has full CRUD now — Phase 1 added
`apps/api/src/routes/shifts.ts` — but zero admin UI to manage shifts
exists). Pick ONE.

### Prompt for Claude Code — Option A: Real Auth + Role-Based Access

```
SevaMitra currently has zero authentication anywhere in apps/api — every
route is open, and the volunteer app's only "session" is a raw
volunteerId stored in localStorage with no server-side verification
(apps/web/app/volunteer/page.tsx has a KNOWN LIMITATION comment
documenting this from Phase 1). Meanwhile prisma/schema.prisma already
has a fully-modeled VolunteerSession table (otp, otpExpiresAt, token,
isVerified, ipAddress, userAgent, createdAt, expiresAt) designed for real
session-based auth and never wired up. apps/api/package.json already has
jsonwebtoken and bcryptjs as dependencies (currently unused — grep to
confirm).

Build real session-based auth using the existing schema and dependencies:

1. Add POST /api/auth/request-otp (creates a VolunteerSession row with a
   generated OTP + otpExpiresAt ~5 min out, looks up the volunteer by
   phone) and POST /api/auth/verify-otp (checks the OTP against the
   VolunteerSession row, marks isVerified, issues a JWT via
   jsonwebtoken, stores it in the token column). Keep OTP delivery
   simulated (log it server-side — no SMS provider is configured
   anywhere) but make verification real: the OTP must actually match
   what was generated, replacing apps/web/app/volunteer/page.tsx's
   current "any 6 digits works" behavior.

2. Add JWT verification middleware in apps/api/src/lib/ (new file) and
   apply it to routes that should require a logged-in volunteer
   (check-in/out, incident reporting) — read req.user.id from the
   verified token instead of trusting a client-supplied volunteerId
   anywhere it currently appears in a request body.

3. Add a role field to the Volunteer model (default "VOLUNTEER", plus
   "ADMIN"/"COORDINATOR") via a Prisma schema change + migration, and
   gate the dashboard/incident-deploy/allocation routes behind it.

4. Update apps/web/app/volunteer/page.tsx and the volunteer/home/
   profile/report pages to store the JWT (not just a raw ID) and send it
   as a Bearer token on every request.

5. Add a basic login gate for the /dashboard, /zones, /incidents,
   /volunteers, /reports admin pages — currently completely public.

ACCEPTANCE CRITERIA:
- A request to a protected endpoint with no token or an invalid token
  returns 401.
- OTP verification actually validates against VolunteerSession, not
  "any 6 digits."
- Existing demo flows still work end-to-end with auth in place; update
  DEMO.md if the demo steps change.
- JWT_SECRET is read from env, never hardcoded.

DO NOT in this phase: touch visual design, add OAuth/social login, or
attempt real SMS delivery.
```

### Prompt for Claude Code — Option B: Shift Scheduling Admin UI

```
apps/api/src/routes/shifts.ts already has full CRUD (GET list, GET by
id, POST, PUT, DELETE, plus GET /upcoming) — Phase 1 added this. What's
still missing is any admin-facing UI to actually manage shifts, and any
volunteer-facing view of "shifts I'm assigned to" beyond
apps/web/app/volunteer/home/page.tsx's single "next assignment" card.

1. Add a coordinator-facing shift management view — a new
   /dashboard/shifts page (or a section within the existing dashboard)
   using the Phase 2 Card/Button/Badge/Modal primitives, that lists
   shifts, shows how many volunteers are assigned per shift relative to
   task minVolunteers/maxVolunteers, and allows creating a new shift
   (start/end time) and assigning volunteers to it — reuse the
   allocation engine's POST /api/allocation/recommendations (fixed in
   Phase 1) to suggest who to assign, and use the new Modal component
   for the assignment picker.

2. Surface shift capacity conflicts: the allocation engine's
   calculateAvailabilityScore already detects time-overlapping
   assignments for scoring purposes. Surface this as a visible hard
   validation warning when a coordinator tries to double-book a
   volunteer across overlapping shifts in the new UI, not just a lower
   recommendation score.

3. On the volunteer side, extend apps/web/app/volunteer/home/page.tsx
   (or add a dedicated view) to show more than just the single next
   assignment — a short list of the volunteer's upcoming shifts for the
   event, using GET /api/shifts/upcoming filtered to their own
   assignments.

ACCEPTANCE CRITERIA:
- A coordinator can create a shift, see it in a list, and assign
  volunteers to it through a real UI (not just via curl/Postman).
- Double-booking a volunteer across overlapping shifts is prevented or
  clearly warned against.
- prisma/seed.ts produces enough shifts/assignments that this feature is
  demonstrable out of the box.

DO NOT in this phase: build a full drag-and-drop calendar (a list/table
view is sufficient), or touch authentication.
```

---

## Phase 6 — Performance & Real-Time Robustness

**Goal:** harden what's built, including the incident auto-deploy/socket
system that landed via the external PR — don't rebuild it, verify it
holds up.

### Prompt for Claude Code

```
Audit and harden SevaMitra's performance and real-time reliability.
Assume Phases 1-5 have run. This touches apps/web, apps/api, and
prisma/schema.prisma but adds no new user-facing features.

1. SOCKET.IO RECONNECTION: apps/api/src/index.ts's Socket.io setup
   (including the incident:deployed/incident:resolved/incident:new
   events from the merged auto-deploy system, plus the original
   assignment:updated/incident:reported events) and the client usage in
   apps/web/app/page.tsx/dashboard/page.tsx have no reconnection
   handling, no connection-state UI feedback, and no catch-up on missed
   events after a drop — a realistic failure mode for a mobile volunteer
   at a crowded event with patchy connectivity. Add exponential-backoff
   reconnection (socket.io-client supports this natively — configure,
   don't hand-roll), a visible "reconnecting..." state distinct from
   "waiting for live updates" (currently identical empty states for
   "never connected" vs "connected then dropped," which is misleading),
   and a full data refetch on reconnect.

2. PRISMA QUERY / INDEX AUDIT: check apps/api/src/routes/*.ts for
   over-fetching — e.g. does GET /api/volunteers include the full
   assignments.task/assignments.shift graph for every volunteer even on
   list views that only render name/email/phone/skills/reliability/
   status? Add a leaner query for list endpoints, reserve full includes
   for :id detail routes. Cross-check prisma/schema.prisma's @@index
   declarations against actual WHERE/ORDER BY usage in the routes.

3. IMAGE OPTIMIZATION: apps/web/app/page.tsx uses raw <img> tags
   (eslint-disabled) for the hero gallery instead of next/image, loading
   large unoptimized JPEGs at full resolution for a crossfading
   background — likely the single biggest Lighthouse LCP cost in the
   app. Convert to next/image with priority on the first visible image
   and appropriately sized/compressed variants.

4. LIGHTHOUSE PASS: run Lighthouse (mobile + desktop) against / and
   /volunteer/home post-changes, address the top opportunities, record
   before/after scores. Confirm MapSection's next/dynamic(ssr:false)
   code-splitting pattern (already used) is also applied to Recharts on
   the dashboard if it isn't already.

5. API RESPONSE CACHING: only relevant if redis remains a real
   dependency post-Phase-1 (it was previously used only by the deleted
   dead chat route) — check apps/api/package.json first. If nothing
   legitimate uses redis, don't reintroduce it just for this; if it's
   still needed for something else, consider a short TTL cache (30-60s)
   on read-heavy slow-changing endpoints like GET /api/zones.

ACCEPTANCE CRITERIA:
- Socket disconnection is visibly different from "never connected," and
  reconnection is automatic with backoff.
- Lighthouse performance score on / (mobile) improves measurably from a
  documented baseline.
- GET /api/volunteers list-view payload is measurably smaller than
  before this phase.
- No new features or visual changes — this is purely a hardening pass.
```

---

## Phase 7 — Accessibility Hardening Pass

**Goal:** a full audit against the project's own older-age-friendly goals
(48px+ touch targets, 16px+ base font, high contrast) — not spot checks.
Phase 2 already fixed the global baseline (button/input tap-target floor,
--text-muted contrast); this phase verifies it actually holds across
every real page and catches what Phase 2 couldn't have — Phase 2's own
global fix caused (and Phase 2 later fixed) a regression on the homepage's
carousel dots, which is a useful example of the kind of thing to hunt for
here: any small/icon-only interactive element added without an explicit
size override.

### Prompt for Claude Code

```
Audit the ENTIRE app against SevaMitra's own older-age-friendly bar
(48px+ touch targets, 16px+ base font, high contrast) — every route, not
a sample. Assume Phases 1-6 have run.

1. VIEWPORT ZOOM: confirm apps/web/app/layout.tsx's viewport export
   doesn't set userScalable:false or maximumScale:1 (if Phase 3-6 didn't
   already catch this, fix it now — pinch-to-zoom must work).

2. TOUCH TARGET AUDIT: systematically check every clickable element
   across /, /dashboard, /zones, /incidents, /volunteers, /reports,
   /register, /volunteer, /volunteer/home, /volunteer/profile,
   /volunteer/report against a 48x48px minimum using actual bounding-box
   measurements (browser devtools or a script), not visual inspection.
   Specifically re-check every small/decorative button added across
   Phases 3-6 (carousel controls, modal close buttons, table row
   actions) for the same "inherited global 48px min-height stretched a
   small element" class of bug found and fixed on the homepage's
   carousel dots, AND the inverse — small icon buttons that opted out of
   the floor and ended up under 48px.

3. CONTRAST AUDIT: run an automated contrast checker (axe-core or
   equivalent) against every text/background pairing actually rendered
   in production. Phase 2 fixed --text-muted's base contrast — verify it
   still passes when combined with any new tints/overlays Phases 4-6
   introduced, and check severity/priority Badge text-on-background
   pairs specifically (components/ui/Badge.tsx's tone system) since
   badges are the most color-dense UI in the app.

4. TRUNCATED DATA: the volunteer table (page.tsx, volunteers/page.tsx)
   truncates the skills column to 20 characters with "..." and no way to
   see the full value. Add a title attribute at minimum.

5. SEMANTIC HTML / SCREEN READER AUDIT: check form labels (properly
   associated via <label for=...> or aria-label), heading hierarchy (one
   h1 per page, logical h2/h3 nesting reflecting document structure, not
   chosen for visual size), and interactive elements that aren't real
   <button>/<a> (onClick on <div>/<span> without role="button" + keyboard
   handling).

6. FOCUS VISIBILITY: confirm globals.css's focus-visible outline
   (outline: 2px solid var(--gold)) isn't clobbered by any inline
   border/outline override introduced in later phases.

7. FORM VALIDATION MESSAGING: register page, incident report page —
   confirm validation errors are screen-reader-announced (aria-live or
   aria-invalid + aria-describedby), not just a colored border.

Produce a short written summary (apps/web/ACCESSIBILITY.md) listing every
issue found and fixed, organized by page.

ACCEPTANCE CRITERIA:
- Pinch-zoom works.
- Every interactive element measured is >=48x48px (spot-check at least
  15 elements across different pages, including anything added in
  Phases 3-6).
- Zero WCAG AA failures in an automated axe-core scan — paste the
  before/after violation count.
- All form inputs have properly associated labels.
```

---

## Phase 8 — Resume-Readiness Pass

**Goal:** make the project legible and credible to a recruiter skimming
it for 90 seconds, and durable enough a stranger can run it without your
local `.env`.

### Prompt for Claude Code

```
Prepare SevaMitra for portfolio presentation. Assume Phases 1-7 have run.

1. SEEDED DEMO MODE WITHOUT REAL INFRA: confirm docker-compose.yml
   brings up a working Postgres pair with one command, confirm
   `npx prisma db push` + `npx prisma db seed` (prisma/seed.ts is the
   canonical seed script — packages/shared/seed.js was removed in
   Phase 1) populates enough realistic demo data that every page looks
   populated. Add a graceful fallback/mocked response for the AI chat
   widget (apps/web/app/api/chat/route.ts) when GROQ_API_KEY is unset,
   instead of it silently erroring, so the rest of the app is demoable
   without that key.

2. README REWRITE: verify the Groq/LLaMA 3.3 70B claim is still
   accurate. Add a real architecture diagram (a mermaid diagram embedded
   in the README — GitHub renders it natively — showing Next.js <->
   Express API <-> Postgres/Prisma, the Socket.io real-time channel
   including the incident auto-deploy events, and the Groq chat
   integration), a clean "Getting Started" including a proper
   apps/web/.env.example (doesn't currently exist), and fresh
   screenshots/GIFs reflecting Phase 4's UI polish — the current
   repo-root screenshots predate this rework.

3. CI: add a minimal GitHub Actions workflow running `npm run lint` +
   `npm run build` for apps/web, `tsc --noEmit` for apps/api, and (once
   item 4 below adds tests) the test suite, on every push/PR. Add the
   status badge to README.md.

4. BASIC TEST SUITE: zero tests exist anywhere in the repo currently.
   Don't attempt full coverage — add focused tests for
   apps/api/src/services/allocationEngine.ts (unit tests for
   calculateSkillsMatch, calculateReliabilityScore,
   calculateProximityScore, calculateWorkloadScore against known
   inputs/outputs — pure, deterministic, highest-signal target), and a
   handful of integration tests for the routes most central to the demo
   (POST /api/incidents/:id/deploy, POST /api/allocation/recommendations).

5. CASE-STUDY WRITE-UP: a focused write-up (docs/CASE_STUDY.md or a
   README section) on the allocation-scoring algorithm — a genuine
   weighted multi-factor system (skills 30%, reliability 25%,
   availability 20%, proximity 15%, workload 10%). Name at least one
   honest limitation (e.g. the proximity score is a crude state-name
   string match, not real geodistance — say what a production version
   would do differently). Honesty about a limitation reads better to a
   technical recruiter than pretending it's perfect.

ACCEPTANCE CRITERIA:
- A stranger can clone, docker-compose up, seed, and see a fully
  populated app within 10 minutes, with AI chat degrading gracefully
  without a Groq key.
- README has a working CI badge, architecture diagram, current
  screenshots/GIFs.
- Tests run and pass in both apps, covering at minimum the allocation
  engine's scoring functions.
- The case study names at least one honest limitation.

DO NOT in this phase: change application behavior, add features, or
touch the design system.
```

---

## Phase 9 — Final QA + Deploy Pass

**Goal:** close the loop — verify every prior phase actually shipped
correctly together, then deploy.

### Prompt for Claude Code

```
Final integration and deploy pass for SevaMitra, after Phases 1-8 have
each run. Catch anything that broke on integration, then ship.

1. FULL REGRESSION WALKTHROUGH: exercise every route end-to-end —
   register a volunteer -> log in via OTP -> volunteer home -> check in
   -> report an incident -> confirm it appears on the coordinator
   dashboard -> deploy volunteers to it -> confirm the real-time feed
   and toast reflect it -> confirm reports/leaderboard reflects the new
   data. Fix any breakage from phase integration.

2. CROSS-PHASE CONSISTENCY: confirm Phase 2's tokens are still the only
   source of truth (no regressions reintroducing hardcoded colors),
   confirm Phase 7's accessibility fixes survived Phase 4's motion work,
   confirm Phase 8's test suite still passes against final code.

3. ENVIRONMENT/DEPLOY CONFIG AUDIT: verify apps/web/.env.production,
   docker-compose.yml, and whatever Render uses reflect the final
   architecture (e.g. if Phase 5 Option A added JWT auth, confirm
   JWT_SECRET is documented as required in production; confirm redis is
   fully removed from deploy config if Phase 6 confirmed nothing needs
   it).

4. LIGHTHOUSE + ACCESSIBILITY RE-CHECK: re-run Phase 6 and Phase 7's
   checks one final time against the fully integrated app.

5. LIVE SMOKE TEST: re-drive the actual production site with a headless
   browser (the same method that found Phase 3's P2021/hydration bugs)
   and confirm every page loads real data with zero console errors —
   don't just trust that local dev works.

6. DEPLOY: pushing to the live Vercel deploy and/or Render-hosted API —
   confirm with me before pushing to production; this is a shared,
   externally-visible system and should not be deployed without an
   explicit go-ahead in this session.

ACCEPTANCE CRITERIA:
- Full regression walkthrough completes with no errors.
- Test suite, lint, and build all pass cleanly.
- Live smoke test against production shows zero console errors and real
  data on every page.
- I have explicitly confirmed before any production deploy step runs.
```
