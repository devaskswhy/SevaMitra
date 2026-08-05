# SevaMitra — Portfolio Flagship Roadmap

**This is a rewrite of the original roadmap, produced by re-auditing the
repo after Phases 1 and 2 below were actually implemented and pushed to
`master`.** Phases 1 and 2 are marked done with their commit hashes and
kept only as a historical record — don't re-run them. Phases 3 onward are
current, freshly verified against the live deploy, and are what's actually
left. Each phase is still a **self-contained prompt** — copy the whole
"Prompt for Claude Code" block into a fresh session to execute that phase
in isolation.

## ✅ Phase 3 is done — the live deploy works again

Both bugs described in the original version of this section are fixed
and verified live: the production Postgres (Neon, via Render) had no
schema at all (`P2021` on every data endpoint) — `prisma db push` +
`db seed` were run against it directly, and all six previously-400ing
endpoints (`/api/volunteers`, `/zones`, `/incidents`, `/tasks`,
`/assignments`, `/shifts`) now return 200 with real seeded data,
re-confirmed with a fresh headless-browser pass over `/dashboard`,
`/zones`, `/incidents`, `/reports`, `/volunteers`, `/register`. The
`TopBanner.tsx` clock hydration mismatch (`useState(new Date())` causing
minified React errors `#425`/`#418`/`#423`) is also fixed — the clock now
seeds as `null` and only sets a real value client-side post-mount,
verified against a local production build with zero hydration errors on
every previously-affected page. The schema+seed push was run directly
against the production Neon database (not a git commit, no code
change); the TopBanner fix is commit `a568d4b`.

## Status

| Phase | What | Status |
|---|---|---|
| 1 | Bug/glitch fix pass | ✅ Done — `940b8c3` / `48ed272` |
| 2 | Design system consolidation | ✅ Done — `bc5c1b4` / `69831a2` |
| 3 | Restore production + close what Phase 1/2 didn't reach | ✅ Done — Neon schema+seed push / `a568d4b` |
| 4 | Authentication foundation (Google OAuth via NextAuth.js) | ✅ Done — `9294b86` |
| 5 | Reframe landing page into login + build the floating feature hub | ✅ Done — `9d26127` |
| 6 | Finish primitive rollout + signature motion polish | ✅ Done — `b152978` |
| 7 | New feature depth (shift scheduling admin UI) | ✅ Done — `45ac8ed` |
| 8 | Performance & real-time robustness | ✅ Done — `66bdbf8` |
| 9 | Accessibility hardening (full audit) | ✅ Done — `66bdbf8` |
| 10 | Resume-readiness (README, tests, CI, case study) | ✅ Done — `87b96b4` |
| 11 | **Final QA + deploy** | ⬅ Do this next |

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
robustness" Phase 8 below would otherwise have asked for — don't
duplicate it. **Phase 5 needs to port this specific implementation from
`page.tsx` into `incidents/page.tsx`, which currently lacks it** — see
Phase 5 for why.

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
duplicating hex), motion tokens, and four new primitives in `apps/web/
components/ui/`: `Button`, `Card`, `Badge` (with `severityToBadge`/
`priorityToBadge`/`statusToBadge` helpers), and `Modal` (the app's first
— focus trap, Escape, click-outside). Migrated `page.tsx`, `dashboard/
page.tsx`, `zones/page.tsx`, `incidents/page.tsx` onto the primitives.
Zero hardcoded hex remains in `volunteer/**/*.tsx`. `--text-muted`'s
contrast was measured at ~3:1 (fails WCAG AA) and raised to ~5.1:1. See
commit `bc5c1b4`.

**Known gap left for Phase 6:** `reports/page.tsx`, `volunteers/page.tsx`,
`register/page.tsx`, and all four `volunteer/*` mobile pages still don't
use the new `Button`/`Card`/`Badge` primitives — they use the *tokens*
but still hand-roll their own badge/card/button markup.

**A regression this surfaced, already fixed:** Phase 2's global `button {
min-height: var(--tap-target) }` (48px) stretched the homepage's
decorative hero-carousel dot indicators into large rectangles. Fixed with
a scoped override (`69831a2`) — a pattern worth checking for again in
Phase 5/9, since the new floating hub tiles are exactly this class of
element (small, icon-driven, easy to forget a size override on).

---

## Phase 3 (done) — Restore Production + Close What Phase 1/2 Didn't Reach

Fixed both bugs found while re-auditing for the previous rewrite of this
file. (1) The production Postgres (Neon, reached via Render's
`DATABASE_URL`) had no schema applied at all — every data endpoint threw
Prisma `P2021` ("table does not exist"). Fixed by running `npx prisma db
push` + `npx prisma db seed` directly against the real production
database once its credential was supplied. Re-verified with a fresh
headless-browser pass: all of `/dashboard`, `/zones`, `/incidents`,
`/reports`, `/volunteers`, `/register` now load real seeded data with
zero API failures. (2) `apps/web/components/TopBanner.tsx` seeded its
live clock with `useState(new Date())`, mismatching the SSR and
client-hydration timestamps and throwing React hydration errors
(`#425`/`#418`/`#423`) on every page rendering it. Fixed by seeding the
clock as `null` and only setting a real value in a client-only
`useEffect`. See commit `a568d4b`.

---

## Phase 4 (done) — Authentication Foundation (Google OAuth via NextAuth.js)

Wired up real Google sign-in as pure infrastructure — no UI redesign, no
gating, nothing about existing pages changed. Added `app/api/auth/
[...nextauth]/route.ts` (Google provider, JWT sessions, no Prisma
adapter), `components/AuthProvider.tsx` (`SessionProvider` wrap in
`layout.tsx`), and `middleware.ts` scoped to `/hub/:path*` (a route that
didn't exist yet, so it gated nothing live). `.env.example` documents the
four new vars. Verified end-to-end against real Google OAuth credentials:
`/api/auth/providers` lists Google with the correct callback URL, and
clicking through actually redirects to Google's real consent screen
showing "Sign in to continue to SevaMitra." Applies only to the
admin/coordinator side — the volunteer phone+OTP flow was untouched. See
commit `9294b86`.

---

## Phase 5 (done) — Reframe Landing Page Into Login + Build the Floating Feature Hub

Reframed `app/page.tsx` into the login/marketing page — hero slideshow
kept as-is, a brief About section added, "Sign in with Google" wired via
`signIn('google', { callbackUrl: '/hub' })`. Every operational section
that used to live there was relocated, not deleted-and-lost: `#stats`/
`#zones`/`#volunteers`/`#chatbot`/activity-feed already had real homes on
`dashboard`/`zones`/`volunteers`/the new global chat widget; `#map` had
no home anywhere else and was ported to a new `app/map/page.tsx`
(TopBanner+Sidebar chrome, added to `Sidebar`'s nav); `#incidents`'
deploy button + toast notifications + real-time Socket.io handling
didn't exist anywhere else and were ported into `incidents/page.tsx`,
which previously only had a static list. Added `app/hub/page.tsx` (new)
— the post-login floating hub, styled after
`https://portfolio-niti-kanoongo.vercel.app/`: a black-to-saffron
gradient, a bold welcome moment, live stat tiles, and 6 floating tiles
that are miniature content previews of their destination page (not
icons), scattered at varied rotation with idle float + hover-straighten
motion. SevaSahayak promoted to a global widget
(`components/GlobalChatWidget.tsx`, mounted in `layout.tsx`).
`middleware.ts` now gates `/hub`, `/dashboard`, `/zones`, `/incidents`,
`/volunteers`, `/reports`, `/register`, `/map`, redirecting signed-out
visits to `/` instead of NextAuth's default sign-in page. `Button`
gained a `shape="pill"` variant.

**A real bug found and fixed during verification:** the hero's
scroll-linked fade was rendering at its end state (invisible) even at
scroll position zero. `gsap.registerPlugin(ScrollTrigger)` only ran
inside the parent `Home()` component's effect, but React mounts child
effects (`HeroSection`) before parent effects, so the scroll-linked
timeline could be created before the plugin was registered. Fixed by
registering at module scope instead — only reproduced because the new
page is much shorter than the old one, which is worth remembering if
this pattern gets copied elsewhere. See commit `9d26127`.

---

## Phase 6 (done) — Finish Primitive Rollout + Signature Motion Polish

Migrated the pages Phase 2 explicitly deferred — `reports/page.tsx`,
`volunteers/page.tsx`, `register/page.tsx`, and all four `volunteer/*`
mobile pages — onto `Card`/`Button`/`Badge` (using `statusToBadge` for
status pills). Left intentionally bespoke where a primitive didn't
semantically fit: the leaderboard's rank-circle emoji badges, the
severity 1-5 picker squares, and icon-only nav/header buttons.

Added a shared `useStaggerReveal` hook (`apps/web/lib/scroll.ts`) that
reuses the exact GSAP `fromTo`/`stagger`/`ScrollTrigger` pattern the old
`page.tsx` stats section used, and wired it into `/dashboard`, `/zones`,
`/incidents`, `/volunteers`, `/reports`, `/map` — no framer-motion
introduced for this. `/hub`'s floating tiles now float/settle into their
scattered position+rotation on first mount (staggered `back.out` GSAP
tween) and get a saffron hover glow. The volunteer mobile flow's
OTP-sent→entry transition now fades continuously, and check-in/check-out
share a `checkmark-pop` success state with `volunteer/report/page.tsx`'s
existing checkmark. The login hero's "Sign in with Google" button has a
magnetic cursor-pull interaction (`gsap.quickTo`) as its one signature
moment beyond the image crossfade.

`SacredHeader.tsx` (confirmed dead via grep) was deleted; `PageTransition.tsx`
(also dead, but already depending on the already-installed framer-motion)
was wired into `layout.tsx` for real route-transition motion — confirmed
via an A/B production build that this added **zero** bytes to the shared
JS bundle, since framer-motion was already being pulled into the shared
chunk regardless of whether anything used it.

**Lighthouse note:** no pre-Phase-6 baseline had been captured, so the
"≤5 point regression" criterion couldn't be checked as a literal diff.
Ran Lighthouse on `/` post-phase instead (51 performance / 83
accessibility / 100 best-practices / 100 SEO) and isolated this phase's
specific additions via the bundle-size A/B above — they cost nothing.
The mediocre performance score is most likely the hero's large
unoptimized JPEGs (raw `<img>`, no `next/image`), which is explicitly
Phase 8 item 3's job, not this phase's.

---

## Phase 7 (done) — New Feature Depth: Shift Scheduling Admin UI

Added `apps/web/app/shifts/page.tsx`: a coordinator-facing shift list
(Card/Button/Badge/Modal primitives, same TopBanner/Sidebar chrome as
the other feature pages) showing each shift's per-task capacity
breakdown (assigned vs. task min/max as a colored badge), a "+ New
Shift" Modal (start/end time), and an "Assign Volunteer" Modal that
selects a task, calls `POST /api/allocation/recommendations` for live
scored suggestions, and falls back to a manual active-volunteer picker.

Added real server-side double-booking enforcement to `POST /api/
assignments`: blocks assigning a volunteer into a time-overlapping
shift they haven't checked out of yet, returning `409` with structured
conflict details, unless the caller passes `force: true`. The assign
Modal surfaces this as a named warning with the primary "Assign" action
swapping to an explicit "Assign Anyway" override — verified via curl
(block → 409 → force → 201) and in a real browser (screenshot showing
the warning + override render correctly).

Extended `volunteer/home/page.tsx` with a "More Upcoming Shifts" list
(via `GET /api/shifts/upcoming` cross-referenced against the
volunteer's own assignments) beyond the single next assignment. Wired
the new page into `/hub`'s floating tiles (bottom-center, no collision
with neighbors), `Sidebar.tsx`'s nav, and `middleware.ts`'s auth
matcher. `prisma/seed.ts` needed no changes — its existing 10
shifts/20 tasks/~30 assignments were already enough to demonstrate the
feature once reseeded.

**A live-data hazard found during verification, not a code bug:**
`apps/api/.env` is pointed at the production Neon database, not local
Postgres — `npm run dev` in `apps/api` connects straight to production
by default. All local testing for this phase used an explicit
`DATABASE_URL` override (confirmed via Prisma's own datasource log line
each time) and reseeded only the local Docker container; production was
never touched. Worth fixing `apps/api/.env` if a safer local default is
wanted. See commit `45ac8ed`.

---

## Phase 8 (done) — Performance & Real-Time Robustness

Added a shared `useSocket` hook (`apps/web/lib/socket.ts`) with explicit
exponential-backoff reconnection, a visible connection-status badge
(LIVE/RECONNECTING/OFFLINE, distinct from "waiting for updates"), and a
full refetch specifically on reconnect-after-a-drop. Wired into
`/dashboard` and `/incidents` — `/map` turned out to use static demo
data with no socket at all, so there was nothing to instrument there
despite the original prompt assuming otherwise.

Trimmed `GET /api/volunteers`/`GET /api/zones` list routes to drop
unused nested includes (~40% smaller volunteers payload, measured
directly against real data); left `tasks`/`assignments` routes as-is
since `shifts/page.tsx` and `volunteer/home/page.tsx` depend on their
current shape. Added two schema indexes backed by actual query
patterns: `Assignment(volunteerId, checkOutTime)` (the Phase 7
double-booking check plus the allocation engine's scoring) and
`Incident(status)` (queried by the auto-resolve job, previously
unindexed).

Converted the login hero gallery to `next/image` and dropped
`next.config.mjs`'s `images.unoptimized: true` (dead config — nothing
used `next/image` before this). Code-split `/dashboard`'s Recharts
usage into `components/ZoneCapacityChart.tsx` via
`next/dynamic(ssr:false)`, matching `/map`'s existing MapSection
pattern — dropped `/dashboard`'s First Load JS from 284kB to 182kB.
Redis and NextAuth's session strategy were both already correctly
configured (no redis dependency, JWT sessions) — confirmed, no changes
needed. Lighthouse on `/` went 51 → 76 (mobile-emulated, same
methodology as the Phase 6 baseline). See commit `66bdbf8`.

---

## Phase 9 (done) — Accessibility Hardening Pass

Full-app audit via `@axe-core/playwright` (wcag2a+wcag2aa) across all 14
routes plus a real bounding-box sweep of every interactive element.
Found and fixed real, live bugs, not just theoretical gaps: pinch-zoom
was actually disabled (`layout.tsx`'s viewport export); `Badge`'s solid
variant failed contrast on 4 of 5 tones (white text on bright
saffron/gold/success/warning measured as low as 2.4:1), which alone
was causing violations on `/dashboard`, `/zones`, `/incidents`,
`/reports`, and `/shifts` simultaneously; the globally-mounted
SevaSahayak chat input had zero visible focus indicator on every page;
and the login carousel dots had regressed to an 8×8px tap target again
(the same class of bug fixed once before, `69831a2`) alongside
Leaflet's default 30×30 zoom controls and the volunteer mobile bottom
nav (48px tall but ~35px wide).

Also fixed: critical `select-name`/`button-name` axe violations and
every unlabeled form input across register, shifts, and the volunteer
mobile flow via proper `htmlFor`/`id` association; `role="alert"`/
`role="status"` on form validation and submission feedback so screen
readers announce it; an `opacity-75` wrapper on incidents' Resolved
cards that pushed already-modest text under 4.5:1; and a
`prefers-reduced-motion` fallback for the hub's idle tile bob (this
app's first continuous ambient animation). The hub tiles themselves
were already correctly built as real `role="link"` + keyboard-handled
elements — confirmed, no changes needed there.

Full write-up in `apps/web/ACCESSIBILITY.md`. Re-verified after every
fix: 0 axe violations across all 14 routes. See commit `66bdbf8`.

---

## Phase 9 — Accessibility Hardening Pass

**Goal:** a full audit against the project's own older-age-friendly goals
(48px+ touch targets, 16px+ base font, high contrast) — not spot checks.
The new floating hub tiles and their continuous idle motion are exactly
the kind of addition worth extra scrutiny here: small icon-driven
elements are easy to under-size, and ambient motion needs a
`prefers-reduced-motion` fallback that nothing in this app has needed
until now.

### Prompt for Claude Code

```
Audit the ENTIRE app against SevaMitra's own older-age-friendly bar
(48px+ touch targets, 16px+ base font, high contrast) — every route, not
a sample. Assume Phases 1-8 have run.

1. VIEWPORT ZOOM: confirm apps/web/app/layout.tsx's viewport export
   doesn't set userScalable:false or maximumScale:1.

2. TOUCH TARGET AUDIT: check every clickable element across /, /hub,
   /dashboard, /zones, /incidents, /volunteers, /reports, /register,
   /map, /shifts, /volunteer, /volunteer/home, /volunteer/profile,
   /volunteer/report against a 48x48px minimum using actual bounding-box
   measurements. Specifically check the /hub floating tiles — their
   icon-driven, non-grid layout makes them an easy place to end up
   under 48px, or to inherit the global button min-height in a way that
   breaks the intended floating visual (the exact regression class
   already found once on the homepage's carousel dots, `69831a2`).

3. REDUCED MOTION: the /hub floating tiles (Phase 5/6) introduce this
   app's first continuous ambient animation (idle float/bob). Wrap it in
   a `prefers-reduced-motion: reduce` media query (or the GSAP/CSS
   equivalent) that disables or significantly dampens the idle motion
   for users who've requested it — this is a real, new accessibility
   requirement the pre-hub app never needed.

4. CONTRAST AUDIT: run an automated contrast checker (axe-core or
   equivalent) against every text/background pairing actually rendered
   in production, including the new /hub and /map pages and the
   reframed login page's Sign-in-with-Google control.

5. TRUNCATED DATA: the volunteer table (volunteers/page.tsx) truncates
   the skills column to 20 characters with "..." and no way to see the
   full value. Add a title attribute at minimum.

6. SEMANTIC HTML / SCREEN READER AUDIT: check form labels, heading
   hierarchy, and interactive elements that aren't real <button>/<a>.
   Specifically check the /hub tiles are real, keyboard-navigable,
   screen-reader-labeled links/buttons — not just clickable <div>s,
   since floating/absolutely-positioned UI is an easy place for this to
   slip.

7. FOCUS VISIBILITY: confirm globals.css's focus-visible outline isn't
   clobbered anywhere added since Phase 2, including the new hub tiles
   and the Google sign-in control.

8. FORM VALIDATION MESSAGING: register page, incident report page,
   shift creation form (Phase 7) — confirm validation errors are
   screen-reader-announced, not just a colored border.

Produce a short written summary (apps/web/ACCESSIBILITY.md) listing every
issue found and fixed, organized by page.

ACCEPTANCE CRITERIA:
- Pinch-zoom works.
- Every interactive element measured is >=48x48px, including every /hub
  tile.
- The hub's idle animation respects prefers-reduced-motion.
- Zero WCAG AA failures in an automated axe-core scan.
- All form inputs have properly associated labels, and every /hub tile
  is keyboard-reachable and screen-reader-announced.
```

---

## Phase 10 (done) — Resume-Readiness Pass

**Goal:** make the project legible and credible to a recruiter skimming
it for 90 seconds, and durable enough a stranger can run it without your
local `.env`.

### Prompt for Claude Code

```
Prepare SevaMitra for portfolio presentation. Assume Phases 1-9 have run.

1. SEEDED DEMO MODE WITHOUT REAL INFRA: confirm docker-compose.yml
   brings up a working Postgres pair with one command, confirm
   `npx prisma db push` + `npx prisma db seed` populates enough
   realistic demo data. Add a graceful fallback for the AI chat widget
   when GROQ_API_KEY is unset. Document clearly that Google OAuth
   (Phase 4) requires real Google Cloud credentials to actually sign in
   — a stranger without them should still be able to see the reframed
   login page render correctly, even if they can't get past it; note
   this limitation honestly in the README rather than hiding it.

2. README REWRITE: add a real architecture diagram (mermaid, GitHub
   renders it natively) showing Next.js <-> Express API <-> Postgres/
   Prisma, the Socket.io real-time channel, the Groq chat integration,
   and the new Google OAuth flow (page.tsx login -> NextAuth -> /hub ->
   feature pages). Add a proper apps/web/.env.example covering
   NEXT_PUBLIC_API_URL, GROQ_API_KEY, and the Phase 4 auth vars
   (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET,
   NEXTAUTH_URL). Fresh screenshots/GIFs of the new login page and
   floating hub — the current repo-root screenshots predate this
   entire rework.

3. CI: add a minimal GitHub Actions workflow running `npm run lint` +
   `npm run build` for apps/web, `tsc --noEmit` for apps/api, and (once
   item 4 adds tests) the test suite. Add the status badge to README.md.

4. BASIC TEST SUITE: add focused tests for apps/api/src/services/
   allocationEngine.ts's scoring functions (pure, deterministic,
   highest-signal target), and integration tests for POST
   /api/incidents/:id/deploy and POST /api/allocation/recommendations.

5. CASE-STUDY WRITE-UP: a focused write-up on the allocation-scoring
   algorithm — name at least one honest limitation (e.g. the proximity
   score is a crude state-name string match, not real geodistance).

ACCEPTANCE CRITERIA:
- A stranger can clone, docker-compose up, seed, and see the reframed
  login page and (with their own Google OAuth credentials) the hub and
  feature pages within 10 minutes.
- README has a working CI badge, architecture diagram (including the
  auth flow), current screenshots/GIFs.
- Tests run and pass in both apps.
- The case study names at least one honest limitation.

DO NOT in this phase: change application behavior, add features, or
touch the design system.
```

---

## Phase 11 — Final QA + Deploy Pass

**Goal:** close the loop — verify every prior phase actually shipped
correctly together, then deploy.

### Prompt for Claude Code

```
Final integration and deploy pass for SevaMitra, after Phases 1-10 have
each run. Catch anything that broke on integration, then ship.

1. FULL REGRESSION WALKTHROUGH — TWO SEPARATE FLOWS:
   Admin/coordinator flow: land on the reframed login page -> sign in
   with Google -> arrive at /hub -> click every floating tile and
   confirm each feature page works (dashboard stats + Quick Volunteer
   Allocation, zone map, incidents list WITH working deploy + toast,
   volunteer table, reports/leaderboard, register form, shift
   scheduling) -> confirm SevaSahayak is reachable throughout -> sign
   out -> confirm every gated route redirects to / when signed out.
   Volunteer flow (unrelated, must still work untouched): register a
   volunteer -> log in via OTP -> volunteer home -> check in -> report
   an incident -> confirm it appears on the coordinator's /incidents.
   Fix any breakage found from phase integration.

2. CROSS-PHASE CONSISTENCY: confirm Phase 2's tokens are still the only
   color/type/spacing source, confirm Phase 9's accessibility fixes
   survived Phase 6's motion work (especially the hub's
   prefers-reduced-motion handling), confirm Phase 10's test suite still
   passes against final code.

3. ENVIRONMENT/DEPLOY CONFIG AUDIT: verify apps/web/.env.production,
   docker-compose.yml, and whatever Render/Vercel use reflect the final
   architecture — confirm GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_SECRET, and
   NEXTAUTH_URL are documented as required in production, matching the
   real deployed callback URL.

4. LIGHTHOUSE + ACCESSIBILITY RE-CHECK: re-run Phase 8 and Phase 9's
   checks one final time against the fully integrated app.

5. LIVE SMOKE TEST: re-drive the actual production site with a headless
   browser (the same method that found Phase 3's P2021/hydration bugs)
   and confirm the login page, hub, and every feature page load
   correctly with zero console errors.

6. DEPLOY: pushing to the live Vercel deploy and/or Render-hosted API —
   confirm with me before pushing to production; this is a shared,
   externally-visible system and should not be deployed without an
   explicit go-ahead in this session.

ACCEPTANCE CRITERIA:
- Both regression walkthroughs (admin/hub flow and volunteer flow)
  complete with no errors.
- Test suite, lint, and build all pass cleanly.
- Live smoke test against production shows zero console errors and real
  data/functionality on every page.
- I have explicitly confirmed before any production deploy step runs.
```
