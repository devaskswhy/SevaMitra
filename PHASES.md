# SevaMitra — Portfolio Flagship Roadmap

This file was produced by a full audit of the codebase (`apps/web`, `apps/api`,
`packages/shared`, `prisma/schema.prisma`) cross-referenced against the live
deploy screenshots and `README.md`/`DEMO.md`. Each phase below is a
**self-contained prompt** — copy the whole "Prompt for Claude Code" block into
a fresh session to execute that phase in isolation. Phases are ordered so each
one is independently shippable and later phases build on earlier ones.

## Ground truth established by the audit (read this before running any phase)

- **The actual visual identity is a DARK cinematic theme**, not a light one.
  `apps/web/app/globals.css` literally names itself
  `SEVAMITRA — MAHAKUMBH 2025 IMMERSIVE DARK DESIGN SYSTEM` (`--bg-base:
  #0D0500`, cream text, saffron/gold accents). This is already close to the
  mountstreetprinters.com direction (dark, editorial, cinematic, restrained
  color). Phase 3 leans into this — it does not introduce a light theme.
- **There are three competing, inconsistent design systems in the repo
  simultaneously**:
  1. The polished dark system in `globals.css`, used only by the single-page
     experience at `apps/web/app/page.tsx` (this is what the screenshots and
     README show — it's genuinely good).
  2. A second system referenced by `apps/web/app/dashboard/page.tsx`,
     `zones/page.tsx`, `incidents/page.tsx`, `reports/page.tsx`,
     `volunteers/page.tsx`, `register/page.tsx`, `components/Sidebar.tsx`,
     `components/TopBanner.tsx` — all of these reference CSS custom
     properties (`--bg-primary`, `--bg-secondary`, `--bg-card`,
     `--bg-sidebar`, `--accent-saffron`, `--accent-gold`, `--accent-deep`,
     `--text-light`, `--border`, `--success`) that **are never defined
     anywhere** in `globals.css` or `tailwind.config.ts`. These pages are
     very likely rendering with broken/transparent backgrounds and missing
     colors right now.
  3. A third hardcoded palette (`#0D0A1A`, `#211835`, `#C4B49A`,
     `fontFamily: 'Poppins'`) used only in the four `volunteer/*` mobile PWA
     pages — Poppins is never loaded (`layout.tsx` only loads Inter + Tiro
     Devanagari via `next/font`), so it silently falls back to a system font.
- **The multi-page admin section (`/dashboard`, `/zones`, `/incidents`,
  `/volunteers`, `/reports`) appears to be an earlier iteration that was
  superseded by the single-page `/` experience** but never removed. All
  README/DEMO screenshots are of `/`, none are of `/dashboard` or its
  siblings. Confirm with the repo owner whether these routes should be
  deleted, redirected, or repaired — Phase 1 assumes **repair**, since
  `Sidebar.tsx` still links to them and they may be intentionally kept as an
  "ops console" view.
- **OTP login is confirmed simulated.** `apps/web/app/volunteer/page.tsx`
  fakes OTP send with `setTimeout` and accepts any 6-digit code
  ("Demo: Any 6-digit number works" is shown in the UI). Meanwhile
  `prisma/schema.prisma` has a fully-modeled `VolunteerSession` table (`otp`,
  `otpExpiresAt`, `token`, `isVerified`, `ipAddress`, `userAgent`) with **zero
  backing API routes** — the schema was designed for real auth and never
  wired up.
- **There is no authentication or authorization anywhere in the Express
  API.** Every route in `apps/api/src/routes/*.ts` is unauthenticated. The
  volunteer app's only "session" is a raw `volunteerId` in `localStorage` —
  anyone can open devtools and impersonate any volunteer by ID.
- **Two competing AI chat backends exist; one is dead code.** The chat widget
  (`components/SevaSahayak.tsx`) calls `apps/web/app/api/chat/route.ts`,
  which hits Groq's `llama-3.3-70b-versatile` directly and has **no
  conversation memory** (only the latest message is ever sent, despite a
  system prompt that implies continuity). Separately,
  `apps/api/src/routes/chat.ts` is a full Express implementation using the
  Anthropic SDK + Redis-backed session history + SSE streaming — it is
  registered in `apps/api/src/index.ts` but **never called by the frontend**.
  It also references a non-existent model id (`claude-sonnet-4-6`). Decide
  which implementation is canonical before Phase 1 — the plan below assumes
  you keep the Groq route (it's the one actually in production per the
  README) and delete the orphaned Express/Anthropic/Redis one.
- **No tests, no CI config anywhere** (`find` for `*.test.*`, `*.spec.*`,
  `jest.config*`, `vitest.config*`, and `.github/workflows/` all came back
  empty).
- Secrets hygiene is actually fine: `.env`, `apps/api/.env*`, and
  `apps/web/.env.local` are all correctly gitignored. The only tracked env
  file, `apps/web/.env.production`, contains only a public
  `NEXT_PUBLIC_API_URL` — no leak.

---

## Phase 1 — Bug & Glitch Fix Pass

**Goal:** every confirmed functional defect found in the audit, fixed. No
redesign, no new features — this phase makes the existing surface actually
work as intended so later phases build on solid ground.

### Prompt for Claude Code

```
Fix the following confirmed bugs in the SevaMitra repo (Next.js 14 app at
apps/web, Express API at apps/api, Prisma schema at prisma/schema.prisma).
Do NOT redesign any UI, rename routes for style reasons, or add new
features — this pass is strictly "make it correctly do what it already
claims to do." Work through this list; verify each fix by reading the
calling code and the route it targets, not just by pattern-matching.

1. UNDEFINED DESIGN TOKENS (highest priority — likely breaks entire pages):
   apps/web/app/dashboard/page.tsx, zones/page.tsx, incidents/page.tsx,
   reports/page.tsx, volunteers/page.tsx, register/page.tsx,
   components/Sidebar.tsx, and components/TopBanner.tsx all reference CSS
   custom properties that do not exist anywhere in apps/web/app/globals.css
   or tailwind.config.ts: --bg-primary, --bg-secondary, --bg-card,
   --bg-sidebar, --accent-saffron, --accent-gold, --accent-deep,
   --text-light, --border, --success. Run the app, open each of those
   routes, and confirm what's actually broken. Then either (a) define these
   tokens in globals.css as aliases onto the existing dark palette
   (--saffron, --gold, --marigold, --bg-base, --card-glass, etc.) so these
   pages render correctly using the SAME dark system as the homepage, or
   (b) if you determine these pages are genuinely dead/superseded routes,
   flag that finding back to me before deleting anything — do not delete
   routes in this phase without confirmation.

2. BROKEN ALLOCATION ENDPOINT CALLS: apps/web/app/page.tsx
   (handleFindBestVolunteers) and apps/web/app/dashboard/page.tsx
   (handleFindBestVolunteers) both call `GET ${API}/allocate/recommend`.
   The real route is `POST /api/allocation/recommendations` with a JSON
   body of { taskId, shiftId, limit } (see apps/api/src/routes/allocation.ts).
   Fix both callers to hit the correct endpoint with the correct method and
   body. Note page.tsx has a client-side Math.random()-based fallback that
   masks this bug in the UI — once the real endpoint is wired up correctly,
   remove reliance on the fake fallback for the primary path (keep it only
   as an explicit last-resort if the API is unreachable, and make that
   state visibly different from a real recommendation, e.g. a "using
   offline estimate" label).

3. BROKEN DEPLOY-VOLUNTEERS ENDPOINT CALLS: apps/web/app/page.tsx
   (handleDeployVolunteers) and apps/web/app/dashboard/page.tsx
   (handleDeployVolunteers) both call `POST /incidents/${id}/deploy`. The
   real route is `POST /incidents/:id/deploy-volunteers` and requires a
   `{ volunteerIds: number[] }` body (see apps/api/src/routes/incidents.ts).
   Fix both callers — this will require deciding which volunteers to deploy
   (e.g. reuse the allocation engine's top recommendations for a task in
   that zone, or open a small volunteer-picker; keep the fix minimal and
   consistent with existing UI patterns, don't build a new picker UI in
   this phase unless trivial).

4. HARDCODED LOCALHOST SOCKET URL IN PRODUCTION: apps/web/app/dashboard/page.tsx
   calls `io('http://localhost:4000')` unconditionally. apps/web/app/page.tsx
   already does this correctly by deriving the socket URL from
   NEXT_PUBLIC_API_URL. Apply the same pattern to dashboard/page.tsx so the
   live activity feed works on the deployed site.

5. VOLUNTEER CHECK-IN/CHECK-OUT CONTRACT MISMATCH: apps/web/app/volunteer/home/page.tsx
   posts to `POST /assignments/check-in` and `POST /assignments/check-out`
   with a body of { volunteerId, timestamp }. The real API only supports
   `POST /assignments/:id/check-in` and `/:id/check-out` (assignment ID in
   the URL, no body required — see apps/api/src/routes/assignments.ts).
   Fix the frontend to look up the volunteer's current/next assignment ID
   (it already fetches assignments in fetchData) and call the correct
   per-assignment endpoint.

6. MISSING /api/shifts ROUTE: apps/web/app/volunteer/home/page.tsx calls
   `GET ${API}/shifts`, but no shifts router is mounted anywhere in
   apps/api/src/index.ts (grep apps/api/src/routes — there is no shifts.ts).
   Either add a minimal GET /api/shifts route (list shifts, ordered by
   startTime) to apps/api/src/routes/shifts.ts and mount it in index.ts, or
   if shifts should be derived from a volunteer's existing assignments
   instead of a standalone endpoint, refactor the frontend call
   accordingly — pick whichever requires the smaller change and is
   consistent with how the rest of the API is shaped (a standalone
   shifts.ts route matches the existing pattern of one router per model, so
   prefer that).

7. DEAD/DUPLICATE AI CHAT BACKEND: apps/web/components/SevaSahayak.tsx
   calls `/api/chat`, which resolves to apps/web/app/api/chat/route.ts
   (Groq llama-3.3-70b-versatile, no conversation memory — only the latest
   message is ever sent). Separately, apps/api/src/routes/chat.ts is a full
   competing implementation (Anthropic SDK + Redis session history + SSE
   streaming) that is mounted in apps/api/src/index.ts but never called by
   any frontend code, and references a nonexistent model id
   "claude-sonnet-4-6". Keep the Groq route (it's what's actually live and
   documented in the README) and delete the orphaned Express route
   (apps/api/src/routes/chat.ts), its mount point in index.ts, and the now-
   unused `redis` and `@anthropic-ai/sdk` dependencies from
   apps/api/package.json IF nothing else in apps/api uses them (grep first).
   Separately, fix the surviving Groq route so it actually sends
   conversation history: apps/web/app/api/chat/route.ts currently discards
   all prior turns. Change SevaSahayak.tsx to send the full message array
   (or the last N turns) and update the route to forward that array to Groq
   instead of a single { message } string.

8. SIMULATED OTP LOGIN: apps/web/app/volunteer/page.tsx fakes OTP send/verify
   entirely client-side and accepts any 6-digit code. This is explicitly
   out of scope to make "real" (no SMS provider) in this phase — but the
   current implementation doesn't even hit the existing VolunteerSession
   Prisma model. At minimum: keep the simulated OTP UX (this is a demo app
   with no SMS provider budget) but make the "Demo: Any 6-digit number
   works" disclosure more prominent and consistent with how DEMO.md
   describes it, and confirm this is intentional rather than half-finished
   before touching it further. Do not attempt to build real SMS delivery in
   this phase — that's explicitly deferred to a future phase if ever, given
   there's no SMS provider configured anywhere in the env files.

9. IDOR VIA LOCALSTORAGE VOLUNTEER ID: every volunteer/* page trusts a raw
   `volunteerId` from localStorage with no server-side verification. This
   phase should NOT attempt full auth (that's Phase 4 scope) but should at
   minimum add a code comment / README note flagging this as a known
   limitation so it isn't mistaken for a finished feature, since Phase 4
   will replace it with real session-based auth.

10. HARDCODED FORM DATA ON REGISTRATION: apps/web/app/register/page.tsx
    submits age: 25, gender: 'M', homeState: 'Uttar Pradesh', and
    aadhaarHash: 'hash_' + Date.now() for every registrant regardless of
    input. Add real form fields for age, gender, and home state (the
    Prisma Volunteer model already requires them), and generate
    aadhaarHash server-side from a real (or plausibly-fake-for-demo)
    input rather than a timestamp string. This directly affects the
    allocation engine's location-proximity scoring, which currently can
    never differentiate volunteers because they all share one hardcoded
    homeState.

11. UNSTYLED/MISSING FONT: volunteer/home, volunteer/profile,
    volunteer/report, and volunteer/page.tsx hardcode
    fontFamily: 'Poppins, sans-serif' throughout, but Poppins is never
    loaded via next/font or a <link> tag in layout.tsx (only Inter and Tiro
    Devanagari Sanskrit are loaded). Either load Poppins properly via
    next/font/google and wire it into a CSS variable, or — preferred, for
    consistency with the rest of the app — replace these hardcoded Poppins
    references with the existing --font-heading/--font-body variables so
    the volunteer mobile flow shares real typography with the rest of the
    app instead of silently falling back to the system font.

12. MISSING PWA ICONS: apps/web/app/manifest.json references
    /icon-192.png and /icon-512.png, but apps/web/public contains no such
    files (confirmed via directory listing). Generate or source appropriate
    icon assets (reuse the Om/saffron branding) and add them to
    apps/web/public so PWA install doesn't show a broken icon. Also note
    manifest.json's background_color is #ffffff and theme_color is
    #FF6B35, inconsistent with the actual dark app shell (#0D0500) — align
    these to the real dark palette.

13. NON-FUNCTIONAL EXPORT BUTTON: apps/web/app/reports/page.tsx's
    "Export Report" button calls `alert('Exporting...')` with no real
    export. Either implement a real CSV export of the zone
    performance/leaderboard tables (client-side CSV generation is fine,
    no new dependency needed), or remove the button if export is out of
    scope for this phase — do not leave a fake alert() in place.

14. MISSING LOADING/ERROR/EMPTY STATES: apps/web/app/zones/page.tsx,
    incidents/page.tsx, volunteers/page.tsx (standalone), and
    reports/page.tsx's data fetches only console.error on failure, leaving
    a blank page with no user-facing message. Add a simple inline error
    state ("Couldn't load zones — retry") with a retry button, consistent
    with the existing card/glass-card visual language, to each of these
    fetches. Do not build a global error-boundary system in this phase —
    keep it local and simple per-page.

15. REPO HYGIENE: the repo root currently has stray, duplicate copies of
    hero images (GkxMDfdWoAArpe4-scaled.jpg, Guide-Kumbh-Mela.jpg,
    img29.jpg — untracked) alongside deleted root-level im1.webp/im2.webp/
    im3.webp (these are unrelated to the actual working copies inside
    apps/web/public, which are present and correct — do not touch
    apps/web/public/*.webp). Also apps/web/app/desktop.ini is a stray
    Windows shell file. Check `git status` yourself before touching
    anything, then remove the stray root-level duplicate image files and
    desktop.ini, and add a `desktop.ini` entry to the root .gitignore so it
    doesn't reappear. Confirm none of these root-level files are referenced
    by any import/src path before deleting (they shouldn't be — Next.js
    only serves from apps/web/public).

16. DUPLICATE SEED FILES: prisma/seed.ts (295 lines) and
    packages/shared/seed.js (80 lines) both appear to seed similar data.
    Read both, determine which one is actually wired to `npm run seed` /
    the Prisma `seed` config in package.json, and remove or clearly
    document the other to avoid confusion about which is canonical.

ACCEPTANCE CRITERIA:
- `npm run dev` in both apps/api and apps/web with no console errors on
  first load of: /, /dashboard, /zones, /incidents, /volunteers, /reports,
  /register, /volunteer, /volunteer/home, /volunteer/profile,
  /volunteer/report.
- Every button/action mentioned above (Deploy Volunteers, Find Best
  Volunteers, Check In, Check Out, Export Report) either works end-to-end
  against the real API or is visibly marked as unavailable — no silent
  failures.
- No CSS custom property used anywhere in apps/web is undefined (spot-check
  with browser devtools computed styles on each route).
- `git status` is clean of the stray root-level files listed in item 15.

DO NOT touch in this phase (reserved for later phases): visual redesign of
any kind, new features (shift scheduling routes beyond the minimal fix in
item 6, push notifications, PWA offline support, role-based auth), test
suite creation, README rewrite, or performance optimization. This is a
correctness-only pass.
```

---

## Phase 2 — Design System Overhaul (Foundation)

**Goal:** replace the three competing, partially-undefined visual systems
found in the audit with **one** deliberate token system, and rebuild the
handful of shared primitives (buttons, cards, badges, modals, inputs) on top
of it. This is the foundation Phase 3's signature UI work sits on — no new
pages or features here, just making the existing surface consistent.

### Prompt for Claude Code

```
SevaMitra's frontend (apps/web, Next.js 14 + Tailwind) currently has three
inconsistent design systems: (1) a real, coherent dark system defined in
apps/web/app/globals.css under the "IMMERSIVE DARK DESIGN SYSTEM" header,
used only by apps/web/app/page.tsx; (2) a set of CSS custom properties
(--bg-primary, --accent-saffron, etc.) referenced by dashboard/zones/
incidents/reports/volunteers/register pages and Sidebar/TopBanner that were
either just fixed to alias onto system (1) in a prior phase, or still need
that fix — check current state of globals.css first; (3) hardcoded hex
colors + a missing Poppins font used only in the four volunteer/* mobile
pages. Assume Phase 1 (bug fixes) has already run.

Your job: consolidate onto ONE token system, built from what's already
proven to work in globals.css (the saffron/gold/marigold/cream/deep-brown
dark palette), and rebuild shared primitives on top of it. Keep the
existing dark, cinematic identity — this is a consolidation and refinement
pass, not a re-theme.

1. TYPE SCALE: Define a formal type scale (e.g. a clamp()-based fluid scale
   from a 14px base to a ~72px display size, 6-8 steps) as CSS custom
   properties in globals.css (--text-xs through --text-display or similar).
   Audit apps/web/app/page.tsx and the volunteer/* pages for their current
   ad-hoc font sizes (there are dozens of one-off px values in inline
   styles, e.g. 'clamp(28px, 4vw, 42px)' repeated near-identically across
   every section heading) and replace them with the new scale tokens.

2. SPACING SCALE: Define a spacing scale (4px base unit, e.g. --space-1
   through --space-16) and replace the inline pixel paddings/margins/gaps
   scattered across apps/web/app/page.tsx, dashboard/page.tsx, and the
   volunteer/* pages with scale references. This is a large mechanical
   change — prioritize the most-repeated patterns (card padding, section
   padding, gap values) over exhaustive 100% coverage.

3. COLOR TOKENS: Consolidate the three overlapping color definitions
   (globals.css :root vars, tailwind.config.ts extend.colors, and the
   volunteer/* hardcoded hex values) into a single source of truth in
   globals.css, with tailwind.config.ts colors referencing those CSS vars
   (not duplicating hex values). Delete the hardcoded hex colors from
   volunteer/home/page.tsx, volunteer/profile/page.tsx,
   volunteer/report/page.tsx, and volunteer/page.tsx, replacing them with
   the shared tokens so the mobile volunteer flow visually matches the rest
   of the app for the first time.

4. MOTION TOKENS: apps/web/app/page.tsx already defines --ease-sacred and
   uses GSAP with fairly consistent durations. Formalize this into named
   duration/easing tokens (--duration-fast/base/slow, --ease-sacred) and
   make sure every transition in the codebase (button hovers, card hovers,
   page sections) references them instead of ad-hoc values like
   "all 250ms var(--ease-sacred)" vs "all 300ms ease" appearing
   inconsistently.

5. COMPONENT PRIMITIVES: Create a small set of real, reusable React
   components in apps/web/components/ui/ (this folder already exists with
   IncidentCard, ZoneCard, StatPulse, VolunteerBadge, SacredHeader,
   PageTransition — extend it, don't replace it):
   - Button: replace the .btn-sacred CSS classes + inline style overrides
     scattered across every page with a single <Button variant="primary" |
     "outline" | "danger" size="sm"|"md"|"lg"> component.
   - Card: a single <Card> wrapping the existing .glass-card / .card CSS
     patterns, used consistently instead of each page hand-rolling its own
     div + inline style card look.
   - Badge: for status pills (ACTIVE/INACTIVE, HIGH/MEDIUM/LOW priority,
     severity levels) — there are at least 5 different hand-rolled
     implementations of what is visually the same pill badge across
     page.tsx, dashboard/page.tsx, zones/page.tsx, incidents/page.tsx, and
     reports/page.tsx. Consolidate to one component with a `tone` prop.
   - Modal: there is currently no modal component anywhere in the app;
     add a minimal accessible one (focus trap, Escape to close, click-
     outside to close) since Phase 1's "deploy volunteers" fix and Phase 4
     features will likely need one.
   Migrate at least the /page.tsx, /dashboard, /zones, /incidents pages to
   use these primitives instead of inline styles — full migration of every
   page is not required in this phase if time-constrained, but the
   primitives themselves must be complete and the highest-traffic pages
   (home, dashboard) must use them.

6. ACCESSIBILITY BASELINE FOR THE NEW TOKENS: ensure the new type scale's
   base size is >=16px, all interactive elements (buttons, inputs, nav
   items) using the new spacing scale resolve to >=48px touch targets, and
   run a contrast check on --text-muted (currently rgba(255,248,238,0.35)
   on --bg-base #0D0500) — if it fails WCAG AA for body text, raise the
   opacity floor. This is a baseline check only; the full accessibility
   audit is Phase 6.

ACCEPTANCE CRITERIA:
- Zero hardcoded hex colors remain in apps/web/app/volunteer/**/*.tsx.
- grep for "px'" / inline style font-size and padding values in page.tsx
  and dashboard/page.tsx shows a significant reduction (not necessarily
  zero) in favor of token references.
- components/ui/ contains Button, Card, Badge, Modal, and the existing
  primitives, each with a documented prop API (TypeScript types, no need
  for external docs).
- Visual regression check: take before/after screenshots of /, /dashboard,
  and one volunteer/* page and confirm the dark cinematic identity is
  preserved, not replaced.

DO NOT in this phase: change the actual page layouts/content/copy, add new
sections, implement scroll animations beyond what already exists, or touch
the allocation engine / API. This is a token-and-primitive consolidation
pass only — Phase 3 does the creative layout/motion work on top of this
foundation.
```

---

## Phase 3 — Signature UI/UX Pass

**Goal:** apply real craft and intentional motion to the pages that don't
already have it (everything except `apps/web/app/page.tsx`, which is already
close to the mountstreetprinters.com reference quality), using the token
system from Phase 2. Elevate — don't replace — the saffron/gold/deep-brown/Om
identity.

### Prompt for Claude Code

```
apps/web/app/page.tsx (the single-page home/ops experience) already has a
genuinely strong cinematic identity: full-bleed parallax hero imagery, GSAP
ScrollTrigger reveals, a pinned storytelling sequence for the stats section,
count-up numbers, glassmorphism cards, and a consistent dark saffron/gold/
cream palette (see apps/web/app/globals.css and apps/web/lib/scroll.ts).
Reference: mountstreetprinters.com for the level of craft (cinematic
imagery, editorial confidence, generous whitespace, restrained scroll
motion) — page.tsx is already directionally there. Assume Phases 1 and 2
have run (bugs fixed, one token system + component primitives exist in
apps/web/components/ui/).

Your job is to bring the REST of the app up to that same bar — not to
redesign page.tsx, which should mostly be left alone except where it uses
outdated primitives Phase 2 replaced.

1. DASHBOARD (/dashboard) AND ADMIN PAGES (/zones, /incidents, /volunteers,
   /reports): these currently read as a generic admin template — static
   grids, no motion, no visual hierarchy beyond font-weight. Add: staggered
   entrance animations for card grids on scroll/mount (reuse the GSAP
   patterns already proven in page.tsx's stats section, don't introduce a
   second animation library), meaningful hover states on interactive cards
   (not just a border-color change — consider a subtle lift + glow using
   the --shadow-sacred tokens from Phase 2), and a real page-transition
   when navigating between sidebar items (components/ui/PageTransition.tsx
   already exists — audit whether it's actually wired into the app router
   layout and use it if not).

2. VOLUNTEER MOBILE FLOW (/volunteer, /volunteer/home, /volunteer/profile,
   /volunteer/report): this is the highest-stakes UX in the app (older,
   possibly first-time smartphone users, in bright outdoor daylight,
   completing time-critical tasks). Elevate it with intentional but
   RESTRAINED motion — this audience does not benefit from cinematic
   parallax. Prioritize: clear state transitions (OTP sent -> OTP entry
   should feel like one continuous flow, not a jarring form swap), a
   satisfying success state for check-in/check-out and incident submission
   (the existing checkmark success state in report/page.tsx is a good
   start — extend that quality to check-in/out), and large, confident
   touch targets throughout using Phase 2's spacing tokens.

3. HERO/LANDING MOMENT: page.tsx's hero is strong but static. Add one
   signature interaction that isn't already there — e.g. the stats section
   already pins and reveals; consider whether the hero's image gallery
   dots could become a more editorial credit/caption treatment (photographer
   or location captions, matching mountstreetprinters.com's editorial
   restraint), or whether the "|| सेवा ही पूजा है ||" mark deserves a subtle
   entrance animation on first load rather than appearing instantly. Keep
   additions minimal and intentional — the brief is "confident," not
   "more."

4. NAVBAR/SIDEBAR: apps/web/components/Navbar.tsx and Sidebar.tsx should be
   audited for whether Navbar.tsx is even used anywhere (grep for imports —
   StickyHeader.tsx appears to be what's actually used on the homepage;
   Navbar.tsx may be dead code left over from before StickyHeader was
   built). If Navbar.tsx is unused, delete it. If it's used elsewhere,
   bring its interaction quality up to StickyHeader's level (StickyHeader
   already has a nice collapse-on-scroll + live search treatment worth
   reusing as the pattern for Sidebar's own polish).

5. MICRO-INTERACTIONS: hover states on the volunteer table rows, zone
   cards, and incident cards should feel deliberate (subtle scale/shadow,
   using Phase 2's motion tokens) rather than the current inconsistent mix
   of some elements having hover states and others not.

ACCEPTANCE CRITERIA:
- Every major page (not just /) has at least one deliberate scroll- or
  mount-triggered reveal animation using the existing GSAP setup.
- No new animation/motion library is introduced (GSAP + Lenis already
  cover this — resist the urge to add framer-motion for new work even
  though it's already a dependency; if it's genuinely unused, consider
  removing it in this phase to reduce bundle size, but confirm via grep
  first since apps/web/package.json lists it).
- The volunteer mobile flow's motion is deliberately calmer than the
  desktop marketing experience — confirm this is a conscious choice
  reflected in the code, not an oversight.
- Lighthouse performance score on / does not regress by more than 5 points
  from its Phase 2 baseline after adding these animations (take a baseline
  reading before starting).

DO NOT in this phase: add new features, new data, new routes, or touch the
API/backend. This is a pure frontend craft pass on existing pages. Do not
re-theme away from the dark saffron/gold identity.
```

---

## Phase 4 — New Feature(s)

**Goal:** add genuinely relevant depth that isn't already present, chosen to
fit the existing data model rather than invent scope. The audit found the
interactive Leaflet zone map (`components/MapSection.tsx`/`ZoneMap.tsx`) is
**already implemented and working** (confirmed via screenshot) — so "build a
live zone map" from the original brief is not needed. The two most clearly
underserved areas, backed by existing-but-unused schema/infra, are **real
authentication/role-based access** and **shift scheduling** (the `Shift`
model exists in Prisma with zero CRUD routes). Pick ONE for a single phase
run — both are listed so you can choose based on what's more valuable for a
portfolio narrative.

### Prompt for Claude Code — Option A: Real Auth + Role-Based Access

```
SevaMitra currently has zero authentication anywhere in apps/api — every
route is open, and the volunteer app's only "session" is a raw volunteerId
stored in localStorage with no server-side verification (confirmed via
audit of apps/api/src/routes/*.ts — no auth middleware exists, and
apps/web/app/volunteer/**/*.tsx all just read localStorage directly).
Meanwhile prisma/schema.prisma already has a fully-modeled VolunteerSession
table (otp, otpExpiresAt, token, isVerified, ipAddress, userAgent,
createdAt, expiresAt) that was clearly designed for real session-based auth
and never wired up. apps/api/package.json also already has jsonwebtoken and
bcryptjs as dependencies (currently unused — grep to confirm), suggesting
JWT auth was planned.

Build real session-based auth using the existing schema and dependencies:

1. Add POST /api/auth/request-otp (creates a VolunteerSession row with a
   generated OTP + otpExpiresAt ~5 min out, looks up the volunteer by
   phone) and POST /api/auth/verify-otp (checks the OTP against the
   VolunteerSession row, marks isVerified, issues a JWT using the existing
   jsonwebtoken dependency, stores it in the token column). Keep the actual
   OTP delivery simulated (log it to the server console, as there's no SMS
   provider configured in any env file) but make the verification path
   real — the OTP must actually match what was generated, not accept any
   6-digit code as apps/web/app/volunteer/page.tsx currently does.

2. Add JWT verification middleware in apps/api/src/lib/ (new file, e.g.
   authMiddleware.ts) and apply it to routes that should require a logged-
   in volunteer (check-in/out, incident reporting) — read req.user.id from
   the verified token rather than trusting a client-supplied volunteerId in
   the request body anywhere it currently appears.

3. Add a minimal admin/coordinator role distinction — the Volunteer model
   doesn't currently have a role field; add one (default "VOLUNTEER", with
   an "ADMIN" or "COORDINATOR" value) via a Prisma migration, and gate the
   dashboard/incident-deploy/allocation routes behind it.

4. Update apps/web/app/volunteer/page.tsx and the volunteer/home/profile/
   report pages to store the JWT (not just a raw ID) and send it as a
   Bearer token on every request instead of relying on trusting
   localStorage-provided IDs server-side.

5. Add a basic login gate for the /dashboard, /zones, /incidents,
   /volunteers, /reports admin pages — they are currently completely
   public.

ACCEPTANCE CRITERIA:
- A request to a protected endpoint (e.g. check-in) with no token or an
  invalid token returns 401.
- The OTP verification path actually validates the stored OTP against
  VolunteerSession, not "any 6 digits."
- Existing demo flows (DEMO.md's script) still work end-to-end with the
  new auth in place — update DEMO.md if the demo steps change.
- No secrets (JWT signing secret) are hardcoded; JWT_SECRET is read from
  env (apps/api/.env.example already has a placeholder for this).

DO NOT in this phase: touch the visual design (Phases 2/3 own that), add
OAuth/social login, or attempt real SMS delivery (no provider is budgeted).
```

### Prompt for Claude Code — Option B: Shift Scheduling

```
prisma/schema.prisma already defines a Shift model (id, startTime, endTime,
assignments relation) and Assignment already links volunteers to
tasks+shifts, but there is no CRUD API for shifts anywhere in
apps/api/src/routes/ (confirmed via grep — Shift is only ever included as a
relation, never has its own router), and no admin UI to create/manage
shifts. This is a real, currently-missing feature that fits the existing
data model exactly as-is — no schema changes needed for the basic version.

1. Add apps/api/src/routes/shifts.ts with standard CRUD (GET list, GET by
   id, POST create, PUT update, DELETE) following the exact same pattern as
   apps/api/src/routes/tasks.ts (same sendSuccess/sendPrismaError helpers
   from apps/api/src/lib/apiResponse.ts). Mount it in apps/api/src/index.ts
   as /api/shifts. Add GET /api/shifts/upcoming (shifts with startTime in
   the future, sorted ascending) since apps/web/app/volunteer/home/page.tsx
   already expects a "next shift" concept.

2. Add a coordinator-facing shift management view — either a new
   /dashboard/shifts page (if the admin section survives Phase 1's
   decision about its fate) or a section within the existing dashboard —
   that lists shifts, shows how many volunteers are assigned per shift
   relative to task minVolunteers/maxVolunteers, and allows creating a new
   shift (start/end time picker) and assigning volunteers to it (reuse the
   allocation engine's recommendations from Phase 1's fixed endpoint to
   suggest who to assign).

3. Fix apps/web/app/volunteer/home/page.tsx's "Next Shift" card (broken
   pre-Phase-1 due to the missing /api/shifts endpoint — should already be
   fixed if Phase 1 ran) to use the new /api/shifts/upcoming endpoint
   properly, filtered to shifts the logged-in volunteer is actually
   assigned to (not just any upcoming shift, which is what the current
   client-side filter logic loosely approximates).

4. Consider whether shift capacity conflicts (the allocation engine's
   calculateAvailabilityScore already checks for time-overlapping
   assignments) should surface as a visible warning when a coordinator
   tries to assign a volunteer to two overlapping shifts — the backend
   already detects this for scoring purposes; surface it as a hard
   validation error on the new assignment-creation UI, not just a lower
   score.

ACCEPTANCE CRITERIA:
- A coordinator can create a shift, see it in a list, and assign volunteers
  to it, and a volunteer can see their upcoming shift on
  /volunteer/home.
- Double-booking a volunteer across overlapping shifts is either prevented
  or clearly warned against in the new UI.
- prisma/seed.ts is updated if needed so demo data includes enough shifts
  to make this feature demonstrable out of the box.

DO NOT in this phase: build a full drag-and-drop calendar UI (a simple
list/table view is sufficient for this scope), or touch authentication
(assume Option A either already ran or didn't — don't couple this phase to
it; use whatever the current auth state is).
```

---

## Phase 5 — Performance & Real-Time Robustness

**Goal:** harden what's already built rather than add anything new.

### Prompt for Claude Code

```
Audit and harden SevaMitra's performance and real-time reliability. Assume
Phases 1-4 have run (bugs fixed, design system consolidated, UI polished,
one new feature added). This phase touches apps/web, apps/api, and
prisma/schema.prisma but adds no new user-facing features.

1. SOCKET.IO RECONNECTION: apps/api/src/index.ts's Socket.io setup and the
   client-side usage in apps/web/app/page.tsx / dashboard/page.tsx (or
   wherever it lives post-Phase-1) have no reconnection handling, no
   connection-state UI feedback, and no handling for the case where the
   socket drops mid-session (e.g. mobile volunteer walking through a
   dead zone at a crowded event — this is a realistic failure mode for
   this specific app). Add: exponential backoff reconnection (socket.io-
   client supports this natively — configure it rather than hand-rolling),
   a visible "reconnecting..." indicator distinct from "waiting for live
   updates" (currently the same empty state is shown for both "never
   connected" and "connected then dropped," which is misleading), and a
   full data refetch on reconnect to catch up on missed events (the current
   activity feed does not backfill anything missed while disconnected).

2. PRISMA QUERY / INDEX OPTIMIZATION: audit apps/api/src/routes/*.ts for
   N+1 patterns and over-fetching. Specifically: GET /api/volunteers
   includes assignments.task and assignments.shift for EVERY volunteer on
   every request, even for list views that only need summary data (e.g.
   the volunteer table only shows name/email/phone/skills/reliability/
   status — it doesn't need the full assignment graph). Add a leaner query
   for list endpoints and reserve the full include for the :id detail
   route. Cross-check prisma/schema.prisma's existing @@index declarations
   against the actual WHERE/ORDER BY clauses used in the routes to confirm
   they're being hit (e.g. Incident has indexes on zoneId, severity, type,
   resolvedAt, createdAt — confirm the /status/unresolved and /severity/:level
   routes are actually using these efficiently, not doing an unindexed scan
   plus in-memory filtering).

3. IMAGE OPTIMIZATION: apps/web/app/page.tsx uses raw <img> tags with
   eslint-disable comments for the hero gallery (HERO_IMAGES) instead of
   next/image, and the hero images themselves
   (GkxMDfdWoAArpe4-scaled.jpg, Guide-Kumbh-Mela.jpg, img29.jpg in
   apps/web/public) are large unoptimized JPEGs loaded at full res for a
   crossfading background. Convert these to next/image with appropriate
   sizes/priority props for the first visible image, and generate/serve
   compressed + responsive variants (WAV/AVIF where supported) rather than
   raw JPEGs. This is likely the single biggest Lighthouse win in the app
   given hero images are the largest LCP-blocking assets.

4. LIGHTHOUSE PASS: run Lighthouse (mobile + desktop) against / and
   /volunteer/home post-changes. Address whatever the top 3 opportunities
   are (likely: LCP from hero images, unused JS from GSAP/Leaflet/Recharts
   loaded on pages that don't need them — confirm dynamic imports are
   actually working for MapSection, which apps/web/app/page.tsx already
   loads via next/dynamic with ssr:false — good pattern, audit whether
   Recharts on the dashboard and Leaflet-adjacent code are similarly code-
   split). Record before/after scores in this phase's summary.

5. API RESPONSE CACHING: apps/api has no caching layer despite `redis`
   being a dependency (used only by the now-possibly-deleted chat.ts per
   Phase 1 — if it was deleted, redis may now be entirely unused; if kept
   for something else, note it). For read-heavy, slow-changing endpoints
   like GET /api/zones and GET /api/allocation/stats/overview, consider a
   short TTL cache (30-60s) — only add this if redis remains a dependency
   for a legitimate reason post-Phase-1; don't reintroduce it solely for
   this.

ACCEPTANCE CRITERIA:
- Socket disconnection is visibly different from "never connected" in the
  UI, and reconnection is automatic with backoff.
- Lighthouse performance score on / (mobile) improves measurably from a
  documented baseline; record both numbers.
- GET /api/volunteers response payload size is measurably smaller for the
  list view than before this phase (fewer nested includes).
- No new features or visual changes are introduced — this is purely a
  hardening pass.
```

---

## Phase 6 — Accessibility Hardening Pass

**Goal:** a full audit against the project's own stated older-age-friendly
goals (48px+ touch targets, 16px+ base font, high contrast), not spot checks.

### Prompt for Claude Code

```
SevaMitra's stated accessibility goal (per its own design intent) is to be
older-age-friendly: 48px+ touch targets, 16px+ base font size, high
contrast. Audit the ENTIRE app against this bar — every route, not a
sample. Assume Phases 1-5 have run.

1. CONFIRMED VIOLATION — VIEWPORT ZOOM DISABLED: apps/web/app/layout.tsx
   sets `maximumScale: 1, userScalable: false` in its viewport export. This
   actively blocks pinch-to-zoom, which directly contradicts an older-age-
   friendly goal (low-vision users rely on pinch-zoom). Remove
   userScalable: false and maximumScale: 1 entirely — let users zoom.

2. TOUCH TARGET AUDIT: systematically check every clickable element across
   /, /dashboard, /zones, /incidents, /volunteers, /reports, /register,
   /volunteer, /volunteer/home, /volunteer/profile, /volunteer/report
   against a 48x48px minimum. Known suspects from the initial audit: the
   image dot indicators in page.tsx's HeroSection (currently 8px/24px),
   the search dropdown result rows in StickyHeader.tsx (minHeight: 36px),
   and various icon-only buttons. Fix every instance found, using Phase 2's
   spacing tokens where possible.

3. CONTRAST AUDIT: run an automated contrast checker (e.g. axe-core, or
   manually compute against WCAG AA 4.5:1 for body text / 3:1 for large
   text) against every text/background color pairing actually used in
   production, not just the tokens defined in globals.css. Pay particular
   attention to: --text-muted (rgba(255,248,238,0.35) on #0D0500 — likely
   fails AA for anything but decorative text), the severity/priority badge
   text-on-background pairs (e.g. amber #E65100 text mentioned in some
   badges), and any text overlaid directly on the hero photography in
   HeroSection (the gradient overlay may not guarantee sufficient contrast
   at all scroll positions).

4. TRUNCATED DATA WITHOUT ACCESS TO FULL VALUE: the volunteer table
   (page.tsx, volunteers/page.tsx) truncates the skills column to 20
   characters with "..." and no way to see the full value (no title
   attribute, no tooltip, no expand). Add at minimum a `title` attribute
   with the full untruncated text, and consider whether truncation should
   happen at all on desktop viewports with available width.

5. SEMANTIC HTML / SCREEN READER AUDIT: much of the app is built with
   `<div>` + inline styles rather than semantic elements — audit form
   labels (are all form inputs properly associated with <label for=...>
   or aria-label?), heading hierarchy (does every page have exactly one
   h1 and a logical h2/h3 nesting, or are heading levels chosen for visual
   size rather than document structure?), and interactive elements that
   aren't real <button>/<a> tags (check for onClick handlers on <div>/<span>
   without role="button" and keyboard handlers).

6. FOCUS VISIBILITY: globals.css defines a focus-visible outline for
   buttons (outline: 2px solid var(--gold)) — confirm this is not being
   overridden anywhere (many inline-styled buttons across the app set
   border/outline properties that could clobber this), and confirm inputs/
   selects/links also have equivalently visible focus states.

7. FORM VALIDATION MESSAGING: check that every required form field
   (register page, incident report page) communicates validation errors in
   a way a screen reader announces (aria-live region or aria-invalid +
   aria-describedby), not just a colored border or a message that appears
   visually without being programmatically associated with the field.

Produce a short written summary (as a comment block at the top of a new
apps/web/ACCESSIBILITY.md, or inline in your final response) listing every
issue found and fixed, organized by page, so this audit's findings are
traceable.

ACCEPTANCE CRITERIA:
- userScalable:false is removed and pinch-zoom works on a real mobile
  device or emulator.
- Every interactive element measured is >=48x48px (spot-check with
  browser devtools box model on at least 10 representative elements across
  different pages).
- Zero text/background pairs fail WCAG AA in an automated axe-core scan
  (run it and paste the before/after violation count).
- All form inputs have properly associated labels.
```

---

## Phase 7 — Resume-Readiness Pass

**Goal:** make the project legible and credible to a recruiter or engineer
skimming it for 90 seconds, and durable enough that a stranger can run it
without your local `.env`.

### Prompt for Claude Code

```
Prepare SevaMitra for portfolio presentation. Assume Phases 1-6 have run
(app works correctly, has one consistent design system, has real motion
polish, has one meaningful new feature, is performant, is accessible).

1. SEEDED DEMO MODE THAT WORKS WITHOUT REAL INFRA: currently the app
   requires a real PostgreSQL instance (DATABASE_URL) and, for the chat
   feature, a Groq API key (GROQ_API_KEY) and — pre-Phase-1 — potentially
   Redis + an Anthropic key too. A recruiter cloning this repo should be
   able to get SOMETHING running with minimal setup friction. At minimum:
   confirm docker-compose.yml (already exists at repo root) brings up a
   working Postgres+Redis pair with one command, confirm `npx prisma
   migrate dev` + the seed script (whichever one Phase 1 determined is
   canonical) populates enough realistic demo data to make every page
   look populated, not empty, and add a fallback/mocked response path for
   the AI chat widget when GROQ_API_KEY is unset (rather than the feature
   silently erroring) so the rest of the app is demoable without that key.

2. README REWRITE: the current README.md claims "Groq LLaMA 3.3 70B" for
   SevaSahayak, which is accurate for the surviving chat route post-Phase-1
   — verify this is still true and correct if not. Add: an actual
   architecture diagram (a simple mermaid diagram embedded in the README is
   fine — GitHub renders mermaid natively — showing Next.js <-> Express API
   <-> Postgres/Prisma, the Socket.io real-time channel, and the Groq chat
   integration), a clearer "Getting Started" that resolves the two TODOs
   already flagged in the current README ("Confirm if app-specific .env
   files are also required," "Add Groq API key variable name and setup
   example" — apps/web/.env.example doesn't currently exist at all, only
   apps/web/.env.local/.env.production are referenced in code; add a
   proper apps/web/.env.example), and updated screenshots/GIFs reflecting
   Phase 3's UI polish (the current screenshots at repo root, e.g.
   "Screenshot 2026-07-13 121659.png", are from before this rework —
   replace them with fresh captures, and prefer short GIFs for the
   scroll-triggered motion and the real-time incident deploy flow since
   those don't read well as static images).

3. CI BADGE: apps/web and apps/api currently have zero CI configuration
   (confirmed — no .github/workflows directory exists). Add a minimal
   GitHub Actions workflow that runs `npm run lint` and `npm run build` for
   apps/web, `tsc --noEmit` for apps/api, and (once Phase 7 item 4 adds
   tests) the test suite, on every push/PR. Add the resulting status badge
   to the top of README.md.

4. BASIC TEST SUITE: there are currently zero tests anywhere in the repo.
   Don't attempt full coverage — add focused tests for the highest-value,
   highest-risk logic: apps/api/src/services/allocationEngine.ts (unit
   tests for calculateSkillsMatch, calculateReliabilityScore,
   calculateProximityScore, calculateWorkloadScore with known inputs/
   outputs — this is pure, deterministic logic and the easiest highest-
   signal thing to test well), and a handful of integration tests for the
   Express routes most central to the demo (POST /api/incidents/:id/
   deploy-volunteers, POST /api/allocation/recommendations) using a test
   database or Prisma's test patterns. Use vitest or jest — whichever adds
   less config overhead given the existing TypeScript setup (check
   tsconfig.json in both apps first).

5. CASE-STUDY WRITE-UP: add a short, focused write-up (either a dedicated
   docs/CASE_STUDY.md or a "Engineering Deep Dive" section in the README)
   on the volunteer allocation-scoring algorithm
   (apps/api/src/services/allocationEngine.ts) — this is the most
   defensible, interesting piece of engineering in the app (a genuine
   weighted multi-factor scoring system: skills match 30%, reliability
   25%, availability 20%, proximity 15%, workload balance 10%). Explain
   the problem it solves, why a weighted scoring approach was chosen, and
   one concrete tradeoff or limitation worth naming honestly (e.g. the
   current proximity score is a crude state-name string match rather than
   real geodistance — mention this as a known simplification and what a
   production version would do differently, e.g. real lat/lng + haversine
   distance). Being honest about a limitation reads better to a technical
   recruiter than pretending it's perfect.

ACCEPTANCE CRITERIA:
- A stranger can `git clone`, `docker-compose up`, run the seed script, and
  see a fully populated app within 10 minutes, with the AI chat feature
  degrading gracefully (not erroring) if they don't add a Groq key.
- README has a working CI badge, an architecture diagram, and current
  screenshots/GIFs.
- `npm test` (or equivalent) runs and passes in both apps/web and apps/api,
  covering at minimum the allocation engine's scoring functions.
- The case study write-up names at least one honest limitation, not just
  strengths.

DO NOT in this phase: change any application behavior, add new features, or
touch the design system. This is documentation, tooling, and test coverage
only.
```

---

## Phase 8 — Final QA + Deploy Pass

**Goal:** close the loop — verify every prior phase actually shipped
correctly together, then deploy.

### Prompt for Claude Code

```
This is the final integration and deploy pass for SevaMitra, after Phases
1-7 have each run in their own session. Your job is to catch anything that
broke when these phases were integrated together, then ship.

1. FULL REGRESSION WALKTHROUGH: manually exercise every route listed in
   Phase 1's acceptance criteria end-to-end, in order: register a new
   volunteer -> log in via OTP -> view volunteer home -> check in to a
   shift -> report an incident -> confirm it appears in the coordinator
   dashboard's incident tracker -> deploy volunteers to it -> confirm the
   real-time activity feed reflects it -> check the reports/leaderboard
   page reflects the new data. Fix any breakage found from phase
   integration (e.g. Phase 4's auth changes conflicting with Phase 1's
   endpoint fixes, or Phase 2's component migration missing a page Phase 3
   touched).

2. CROSS-PHASE CONSISTENCY CHECK: confirm Phase 2's design tokens are still
   the only source of truth (no regressions reintroducing hardcoded
   colors), confirm Phase 6's accessibility fixes survived Phase 3's motion
   work (e.g. confirm no new touch target violations were introduced by
   new interactive elements), and confirm Phase 7's test suite still passes
   against the final integrated code.

3. ENVIRONMENT/DEPLOY CONFIG AUDIT: verify apps/web/.env.production,
   railway.json, and docker-compose.yml all reflect the final architecture
   (e.g. if Phase 1 removed the Redis-dependent chat route, confirm Redis
   is removed from deploy config too if nothing else needs it; if Phase 4's
   auth option A was chosen, confirm JWT_SECRET is documented as required
   in production).

4. LIGHTHOUSE + ACCESSIBILITY RE-CHECK: re-run the Lighthouse and axe-core
   checks from Phases 5 and 6 one final time against the fully integrated
   app to confirm nothing regressed.

5. DEPLOY: this step involves pushing to the live Vercel deploy
   (https://seva-mitra-wheat.vercel.app/) and/or the Railway-hosted API —
   confirm with me before pushing to production; this is a shared,
   externally-visible system and should not be deployed without an
   explicit go-ahead in this session.

ACCEPTANCE CRITERIA:
- The full regression walkthrough in item 1 completes with no errors.
- Test suite, lint, and build all pass cleanly.
- I have explicitly confirmed before any production deploy step runs.
```
