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
| 4 | **Authentication foundation (Google OAuth via NextAuth.js)** | ⬅ Do this next |
| 5 | Reframe landing page into login + build the floating feature hub | Pending |
| 6 | Finish primitive rollout + signature motion polish | Pending |
| 7 | New feature depth (shift scheduling admin UI) | Pending |
| 8 | Performance & real-time robustness | Pending |
| 9 | Accessibility hardening (full audit) | Pending |
| 10 | Resume-readiness (README, tests, CI, case study) | Pending |
| 11 | Final QA + deploy | Pending |

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

## Phase 4 — Authentication Foundation (Google OAuth via NextAuth.js)

**Goal:** wire up real, working Google sign-in as pure infrastructure —
no UI redesign, no gating of existing pages yet, nothing about the
current app's behavior changes. This phase exists so Phase 5 (which
builds the actual login page and hub UI on top of it) has a working
`signIn('google')` / `useSession()` to call. Independently shippable and
testable on its own via NextAuth's default `/api/auth/signin` page.

This applies **only** to the admin/coordinator side of the app. The
volunteer mobile flow (`/volunteer`, `/volunteer/home`, `/volunteer/
profile`, `/volunteer/report`) already has its own separate, working
phone+OTP login for a different persona (volunteers in the field) — do
not touch it, do not merge the two auth systems, do not make volunteers
sign in with Google.

### Prompt for Claude Code

```
SevaMitra currently has zero authentication anywhere on the admin/
coordinator side — /dashboard, /zones, /incidents, /volunteers, /reports,
/register are all completely public. Add real Google OAuth using
NextAuth.js (Auth.js), as pure infrastructure — this phase does NOT
change any existing page's content, does NOT gate any existing route yet,
and does NOT touch the separate volunteer OTP login
(apps/web/app/volunteer/**, which is a different persona and out of
scope here).

1. Install next-auth in apps/web. Add
   apps/web/app/api/auth/[...nextauth]/route.ts configuring the Google
   provider, reading GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET /
   NEXTAUTH_SECRET / NEXTAUTH_URL from env. None of these exist yet —
   add them to a new apps/web/.env.example with comments explaining each
   (GOOGLE_CLIENT_ID/SECRET come from a Google Cloud Console OAuth 2.0
   Client ID with an authorized redirect URI of
   <app-url>/api/auth/callback/google; NEXTAUTH_SECRET is any random
   string, e.g. `openssl rand -base64 32`; NEXTAUTH_URL is the app's own
   base URL). I will need to create the actual Google Cloud OAuth client
   myself and supply real values — don't fabricate placeholder
   credentials that look real.

2. Add a client-side SessionProvider wrapper (new file, e.g.
   apps/web/components/AuthProvider.tsx, 'use client') and mount it in
   apps/web/app/layout.tsx around {children}, so useSession() works
   anywhere in the app. This is an additive wrap only — don't restructure
   layout.tsx otherwise.

3. Add apps/web/middleware.ts using NextAuth's session-checking helper,
   but scope its `matcher` to something that matches nothing live yet
   (e.g. a route that doesn't exist yet, like `/hub/:path*`, with a
   comment noting Phase 5 will expand this to cover /dashboard, /zones,
   /incidents, /volunteers, /reports, /register, /map once those are
   ready to be gated). This phase must not lock anyone out of any
   currently-public page.

4. Verify manually: visiting /api/auth/signin shows Google as a sign-in
   option, and completing the flow establishes a session (confirm via a
   temporary console.log of useSession() somewhere, or NextAuth's
   session debug endpoint) — remove any temporary debug code before
   finishing.

ACCEPTANCE CRITERIA:
- Google sign-in works end-to-end when real OAuth credentials are
  supplied (confirm with me that you have working credentials before
  marking this done — if you don't, implement everything correctly and
  tell me exactly what to configure and where).
- Every existing page (/, /dashboard, /zones, /incidents, /volunteers,
  /reports, /register, /volunteer/**) remains exactly as reachable as it
  was before this phase — nothing is gated yet.
- No file outside the new auth files, layout.tsx (SessionProvider wrap),
  package.json (new dependency), and .env.example is modified.

DO NOT in this phase: touch apps/web/app/page.tsx, any page under
apps/web/app/volunteer/**, any file in apps/api, the Prisma schema, or
add any visual login UI — that's Phase 5.
```

---

## Phase 5 — Reframe Landing Page Into Login + Build the Floating Feature Hub

**Goal:** this is the structural centerpiece of the UI rework. Turn the
current homepage (`apps/web/app/page.tsx`) into a marketing/about +
Google-login page — keeping its hero image slideshow and cinematic
identity, removing the live operational sections — and add a new,
authenticated landing experience (`/hub`) where every existing feature is
reached by clicking a floating preview tile instead of a sidebar link.

**Concrete visual reference:** `https://portfolio-niti-kanoongo.vercel.app/`
— specifically its hero and "I don't just prototype ideas..." section.
This is a much closer match to SevaMitra's actual palette than the
mobbin.com reference used in earlier drafts of this phase (that one was
a light theme; this one is dark-to-saffron, essentially SevaMitra's own
colors already). Four concrete patterns to port over, adapted rather than
copied:
1. **Background** — a deep-black-to-saffron/orange diagonal or radial
   gradient (their black→`#FF6B00`-ish transition maps almost exactly
   onto SevaMitra's existing `--bg-base`→`--saffron` pairing), not a flat
   single color.
2. **Floating tiles are real content previews, not generic icons** — on
   the reference site, each floating card is an actual miniature
   screenshot of one of that person's projects, tilted at a slightly
   different angle (roughly -6° to +6°, not aligned to a grid), scattered
   organically around central text. SevaMitra's hub tiles should follow
   this exact idea: each tile is a small stylized preview of the actual
   destination page's content (e.g. the dashboard tile shows a tiny
   glimpse of stat cards, the map tile shows a hint of the zone map, the
   incidents tile shows a hint of the incident list) — not a flat icon +
   label. Reuse Phase 2's `Card` primitive as the tile's base and layer
   the miniature preview inside it.
3. **Bold mixed-weight display typography** for the hub's central
   welcome moment — a large bold statement (use `--text-display`) with
   one phrase set in a contrasting accent treatment. The reference uses
   an italic handwritten script for emphasis; SevaMitra already has an
   equivalent cultural parallel available — `--font-heading` (Tiro
   Devanagari Sanskrit) is already used for the Om mark and Hindi phrase
   elsewhere in the app, so use that as the accent treatment here instead
   of importing a new script font.
4. **Dark stat-tile treatment** — the reference's "900+ / 30+ / AWS /
   Selected" 2x2 grid (bold oversized number, small label below, dark
   near-black rounded card) is worth reusing for a small "at a glance"
   stat row on the hub itself (e.g. Active Volunteers / Open Incidents,
   pulled from the same dashboard stats endpoint) — it reinforces visual
   continuity between the hub and the dashboard it links to.

Elevate these patterns into SevaMitra's existing dark saffron/gold/
deep-brown identity and Phase 2's token system — don't import the
reference's fonts or literal colors, match the *composition and craft*.
Assume Phase 4's NextAuth/Google infrastructure is in place.

**This phase must not lose any existing capability.** page.tsx today has
several live sections beyond the hero — each one's fate is spelled out
below. Read it fully before touching anything; two of these need real
porting work, not just deletion.

### Prompt for Claude Code

```
Assume Phases 1-4 have run: production is restored, the design system +
Button/Card/Badge/Modal primitives exist in apps/web/components/ui/, and
apps/web/app/api/auth/[...nextauth]/route.ts + a SessionProvider in
layout.tsx already provide working Google sign-in (not yet gating
anything). Your job in this phase is structural: reframe the landing
page, relocate its operational content to where it belongs, and build
the new post-login floating hub. Do not touch apps/api, the Prisma
schema, the allocation engine, or apps/web/app/volunteer/** (a separate,
already-working persona/flow — leave it alone).

PART A — REFRAME apps/web/app/page.tsx INTO THE LOGIN/MARKETING PAGE

Keep: the hero section's image carousel/slideshow (HERO_IMAGES crossfade,
dot indicators), the "|| सेवा ही पूजा है ||" mark, the Om watermark, the
overall cinematic look. This is exactly the "cool UI and slideshow
pictures" that should stay. Add a "Sign in with Google" control
integrated into this same hero (not a separate /login route) using
next-auth's signIn('google', { callbackUrl: '/hub' }), styled with the
Phase 2 Button component. The page should otherwise read as an about/
marketing page for what SevaMitra is — no live stats, no data tables, no
operational content visible pre-login.

Every other section currently in page.tsx needs to go somewhere. Handle
each exactly as follows — do not improvise a different disposition:

- #stats (StatCards + "Quick Volunteer Allocation" panel): DELETE from
  page.tsx. apps/web/app/dashboard/page.tsx already has an equivalent,
  fully-working version of both (Phase 1 already ported the same
  handleFindBestVolunteers logic, including the offline-estimate
  fallback and proximity field, into dashboard/page.tsx) — just confirm
  dashboard's version still renders correctly after this change; there
  is nothing here to merge.

- #zones (zone cards grid): DELETE from page.tsx.
  apps/web/app/zones/page.tsx already fully covers this, including the
  Phase 2 Badge-based priority pills.

- #map (the interactive Leaflet MapSection/ZoneMap): this is the one
  section with NO existing home elsewhere. PORT it to a new route,
  apps/web/app/map/page.tsx, wrapped in the same TopBanner + Sidebar
  admin chrome that /zones and /incidents already use (match that
  existing layout pattern, don't invent a new one). This becomes a real,
  standalone feature page.

- #incidents (incident list, Deploy button, toast notifications, the
  pulse-highlight animation for new critical incidents, and the
  socket.on('incident:deployed'/'incident:resolved'/'incident:new')
  listeners): apps/web/app/incidents/page.tsx currently has only a basic
  unresolved/resolved list with NO deploy button and NO real-time socket
  handling at all. PORT the full richer implementation from page.tsx
  into incidents/page.tsx — this replaces incidents.tsx's current
  handling, it is not something you can just delete from page.tsx,
  because nothing else in the app currently has equivalent
  functionality. Take your time getting this one right; it's the
  highest-risk item in this phase for actually losing a working feature.

- #volunteers (volunteer table with search): DELETE from page.tsx.
  apps/web/app/volunteers/page.tsx already covers this.

- #chatbot (the inline SevaSahayak embed section): DELETE this section
  entirely — superseded by Part C below (SevaSahayak becomes a global
  persistent widget, not a page section).

- Live activity feed / socket connection indicator: dashboard/page.tsx
  already has an equivalent "Activity Feed" panel — confirm parity, then
  delete page.tsx's copy.

PART B — BUILD THE FLOATING FEATURE HUB (apps/web/app/hub/page.tsx, new)

A new authenticated route styled after
https://portfolio-niti-kanoongo.vercel.app/'s hero/"real load, real data,
real users" section (see the Goal section above for the specific patterns
to port). After Google sign-in redirects here, show:
- A full-bleed deep-black-to-saffron gradient background (not the flat
  --bg-base the rest of the app uses — this page is the one deliberate
  exception, matching the reference's black-to-orange hero treatment).
- A central welcome moment using the signed-in user's Google profile name
  (via useSession()), set in bold --text-display type with the person's
  name or one key phrase rendered in --font-heading (Tiro Devanagari) as
  the accent treatment, echoing the reference's bold-sans + italic-script
  mix — e.g. "Namaste, {name}" in --font-body bold, "🙏 सेवा के लिए तैयार"
  or similar in --font-heading beneath it.
- A small 2-4 tile "at a glance" stat row (dark near-black rounded cards,
  bold oversized number + small label, matching the reference's
  900+/30+/AWS/Selected grid) pulling from the same stats the dashboard
  already shows (e.g. Active Volunteers, Open Incidents) — GET the data
  from the existing endpoints, don't duplicate calculation logic.
- Floating PREVIEW tiles for each feature page — Dashboard (/dashboard),
  Zone Map (/map), Incidents (/incidents), Volunteers (/volunteers),
  Reports (/reports), Register Volunteer (/register). Each tile is NOT a
  flat icon + label — build it as a small Card containing a miniature,
  simplified visual preview of that page's actual content (e.g. the
  dashboard tile shows tiny stat-card shapes, the map tile shows a
  simplified zone-dot pattern, the incidents tile shows a hint of a
  severity badge list) plus a label. Scatter them around the central
  content at varied positions AND varied rotation (roughly -6deg to
  +6deg per tile, not uniform), not a grid — match the reference's
  organic scatter. Give each tile its own subtle continuous idle
  float/rotate-settle animation, staggered so they don't move in sync,
  using Phase 2's motion tokens (--duration-slow, --ease-sacred); on
  hover, a tile should lift slightly and straighten toward 0deg rotation
  before navigating on click. This is the app's primary post-login
  navigation — deliberately not a sidebar or a button grid.
- SevaSahayak does NOT get a tile — see Part C, it's persistent instead.
- Any button on this page (nav, CTA) should use Phase 2's Button
  component with a fully rounded/pill border-radius variant, matching the
  reference's pill-shaped nav and CTA buttons — if Button doesn't
  currently support a pill shape, add a `shape="pill"` prop rather than
  overriding border-radius inline per usage.

PART C — MAKE SEVASAHAYAK GLOBAL

apps/web/components/SevaSahayak.tsx's floating-widget usage is currently
only mounted in page.tsx (`<SevaSahayakFloat isInline={false} />` via
next/dynamic with ssr:false). Promote it to apps/web/app/layout.tsx
(follow the same 'use client' + next/dynamic(ssr:false) pattern already
used in page.tsx) so it's visible and functional on the login page, the
hub, and every feature page — not tied to any single route. Remove the
now-redundant per-page mount from page.tsx once it's global. Do not
change SevaSahayak.tsx's internal behavior (chat logic, Groq API calls)
at all — this is purely about where it's mounted.

PART D — GATE THE FEATURE ROUTES

Expand apps/web/middleware.ts's matcher (added in Phase 4, currently
scoped to nothing live) to cover /hub, /dashboard, /zones, /incidents,
/volunteers, /reports, /register, /map — redirect unauthenticated
visits to / (the login page). Leave apps/web/app/volunteer/** and every
apps/api route completely ungated — different, already-working auth
story, out of scope here.

ACCEPTANCE CRITERIA:
- / shows the reframed landing page: hero slideshow + about copy + a
  working "Sign in with Google" control. No live operational data is
  visible pre-login.
- Signing in redirects to /hub, showing: the black-to-saffron gradient
  background, the bold display-type welcome moment, the "at a glance"
  stat tiles, the floating preview tiles, and the persistent SevaSahayak
  widget.
- Hub tiles are genuine content previews (a recognizable miniature of
  each destination page), not flat icon+label tiles — spot check this
  visually, it's the whole point of the reference.
- Tiles are scattered at varied positions/rotation, not aligned to a
  grid, and every tile navigates correctly; every destination feature
  page still does everything it did before this phase — specifically
  confirm /incidents now has a working Deploy button with toast feedback
  (it didn't before), /map renders the interactive Leaflet map (it's new
  here), and /dashboard's stats + Quick Volunteer Allocation panel still
  work.
- Visiting any gated route while signed out redirects to /.
- SevaSahayak is visible and functional on the landing page, the hub, and
  at least two feature pages — confirm it's genuinely global, not
  duplicated per-page.
- Nothing under apps/web/app/volunteer/** changed at all.

DO NOT in this phase: touch the Prisma schema, apps/api, the allocation
engine, or the volunteer OTP flow. Don't attempt full visual polish on
the hub tiles or the newly-ported /map and /incidents pages yet beyond
what's needed for them to work correctly and look intentional — Phase 6
is the dedicated craft/motion pass.
```

---

## Phase 6 — Finish Primitive Rollout + Signature Motion Polish

**Goal:** apply real craft and intentional motion to every page that
doesn't already have it, now that Phase 5 has settled the app's final
page structure (login page, hub, and the feature pages including the new
`/map` and the upgraded `/incidents`). This also finishes migrating the
pages Phase 2 explicitly deferred.

### Prompt for Claude Code

```
Assume Phases 1-5 have run: production is restored, one token system +
Button/Card/Badge/Modal exist, and the app now has its final page
structure — a reframed login/marketing page at /, an authenticated
floating hub at /hub, and feature pages at /dashboard, /zones,
/incidents, /volunteers, /reports, /register, /map, all gated behind
Google sign-in. apps/web/app/page.tsx's hero section (kept from before)
is already close to the mountstreetprinters.com reference quality; bring
everything else up to that bar.

1. FINISH THE PRIMITIVE ROLLOUT: apps/web/app/reports/page.tsx,
   volunteers/page.tsx, register/page.tsx, and all four volunteer/*
   mobile pages still hand-roll their own badge/card/button markup
   instead of using components/ui/Badge, Card, and Button (they already
   use the shared tokens — just not the components). Migrate them. Use
   Badge's severityToBadge/priorityToBadge/statusToBadge helpers where
   they apply.

2. FEATURE PAGES (/dashboard, /zones, /incidents, /volunteers, /reports,
   /map): still read as a generic admin template — static grids,
   minimal motion. Add staggered entrance animations for card grids on
   scroll/mount (reuse the GSAP patterns already proven in page.tsx's
   former stats section — don't introduce a second animation library;
   framer-motion is already a dependency used only by the currently-
   unused apps/web/components/ui/SacredHeader.tsx, PageTransition.tsx,
   and VolunteerBadge.tsx — confirm via grep whether those are actually
   wired into any route before deciding whether to standardize on GSAP
   or adopt framer-motion for this pass; don't run both in new code).
   Pay particular attention to /map (newly added in Phase 5) and
   /incidents (newly upgraded with the deploy/toast functionality in
   Phase 5) — bring these two up to the same visual bar as the rest.

3. HUB TILE POLISH: Phase 5 made the /hub floating tiles functionally
   correct but not necessarily polished — add hover glow, a staggered
   entrance animation on first mount (tiles floating/settling into
   position and rotation rather than appearing instantly, matching
   https://portfolio-niti-kanoongo.vercel.app/'s tilted-scatter reference
   from Phase 5), and confirm the idle bob/rotate animation feels
   intentional rather than distracting at rest.

4. VOLUNTEER MOBILE FLOW: this is the highest-stakes UX in the app
   (older, possibly first-time smartphone users, in bright outdoor
   daylight, completing time-critical tasks) and is entirely separate
   from the login/hub work in Phases 4-5. Elevate with intentional but
   RESTRAINED motion — this audience does not benefit from cinematic
   parallax. Prioritize clear state transitions (OTP sent -> OTP entry
   should feel continuous) and a satisfying success state for check-in/
   check-out (the existing checkmark success state in volunteer/report/
   page.tsx is a good reference quality to extend to check-in/out).

5. LOGIN/LANDING MOMENT: the reframed page.tsx (hero + Sign in with
   Google) is strong but static beyond the image crossfade. Add one
   signature interaction that isn't already there — e.g. an entrance
   animation for the sign-in control, or a subtle parallax layer. Keep
   additions minimal and intentional.

6. NAVBAR/DEAD-CODE AUDIT: apps/web/components/ui/SacredHeader.tsx and
   PageTransition.tsx exist but (confirm via grep) are likely not
   imported anywhere real — dead code from an earlier iteration,
   superseded by TopBanner.tsx + Sidebar.tsx (feature pages) and the new
   hub (post-login). If confirmed unused, either delete them or actually
   wire PageTransition into the app router layout for real page-
   transition motion when navigating between hub tiles / sidebar items —
   the latter is more valuable, since a real page transition is
   currently missing.

ACCEPTANCE CRITERIA:
- Zero hand-rolled badge/card/button markup remains in reports.tsx,
  volunteers.tsx, register.tsx, or volunteer/**/*.tsx.
- Every feature page (including the new /map and upgraded /incidents)
  has at least one deliberate scroll- or mount-triggered reveal
  animation.
- The hub's floating tiles have a real entrance animation and hover
  state, not just the bare functional floating from Phase 5.
- The volunteer mobile flow's motion is deliberately calmer than the
  desktop/admin experience.
- SacredHeader.tsx and PageTransition.tsx are either deleted or actually
  used.
- Lighthouse performance score on / does not regress by more than 5
  points from a baseline taken before starting.

DO NOT in this phase: add new features, new routes, new data, or touch
API/backend business logic, the Prisma schema, or the Google auth
plumbing from Phase 4. Do not re-theme away from the dark saffron/gold/
deep-brown identity.
```

---

## Phase 7 — New Feature Depth: Shift Scheduling Admin UI

**Goal:** add genuinely relevant depth that isn't already present, fit to
the existing data model. The live zone map now exists (Phase 5). The
incident auto-deploy/resolve/socket system already covers real-time ops
depth. Real authentication is now done (Phases 4-5). The one clearly
underserved area left, backed by existing-but-unused infra, is **shift
scheduling** — the `Shift` model has full CRUD (`apps/api/src/routes/
shifts.ts`, added in Phase 1) but zero admin UI to manage shifts exists.

### Prompt for Claude Code

```
Assume Phases 1-6 have run: the app has a login+hub structure, all
feature pages use the shared design system, and apps/api/src/routes/
shifts.ts already has full CRUD (GET list, GET by id, POST, PUT, DELETE,
plus GET /upcoming). What's missing is any admin-facing UI to actually
manage shifts, and any volunteer-facing view of "shifts I'm assigned to"
beyond apps/web/app/volunteer/home/page.tsx's single "next assignment"
card.

1. Add a coordinator-facing shift management page,
   apps/web/app/shifts/page.tsx, using the Phase 2 Card/Button/Badge/
   Modal primitives and the same TopBanner/Sidebar chrome as the other
   feature pages, that lists shifts, shows how many volunteers are
   assigned per shift relative to task minVolunteers/maxVolunteers, and
   allows creating a new shift (start/end time) and assigning volunteers
   to it — reuse POST /api/allocation/recommendations to suggest who to
   assign, and use the Modal component for the assignment picker. Add
   this page as a new tile on the /hub floating navigation (Phase 5),
   and to the middleware's protected-route matcher.

2. Surface shift capacity conflicts: the allocation engine's
   calculateAvailabilityScore already detects time-overlapping
   assignments for scoring purposes. Surface this as a visible hard
   validation warning when a coordinator tries to double-book a
   volunteer across overlapping shifts, not just a lower recommendation
   score.

3. On the volunteer side, extend apps/web/app/volunteer/home/page.tsx to
   show more than just the single next assignment — a short list of the
   volunteer's upcoming shifts, using GET /api/shifts/upcoming filtered
   to their own assignments.

ACCEPTANCE CRITERIA:
- A coordinator can create a shift, see it in a list, and assign
  volunteers to it through the new UI.
- Double-booking a volunteer across overlapping shifts is prevented or
  clearly warned against.
- The new page is reachable from /hub and protected by the same auth
  gate as the other feature pages.
- prisma/seed.ts produces enough shifts/assignments that this feature is
  demonstrable out of the box.

DO NOT in this phase: build a full drag-and-drop calendar (a list/table
view is sufficient), or touch authentication/the volunteer OTP flow.
```

---

## Phase 8 — Performance & Real-Time Robustness

**Goal:** harden what's built, including the incident auto-deploy/socket
system and the new login+hub structure — don't rebuild either, verify
they hold up.

### Prompt for Claude Code

```
Audit and harden SevaMitra's performance and real-time reliability.
Assume Phases 1-7 have run. This touches apps/web, apps/api, and
prisma/schema.prisma but adds no new user-facing features.

1. SOCKET.IO RECONNECTION: apps/api/src/index.ts's Socket.io setup
   (incident:deployed/incident:resolved/incident:new, plus
   assignment:updated/incident:reported) and the client usage across
   /dashboard, /incidents, and /map have no reconnection handling, no
   connection-state UI feedback, and no catch-up on missed events after
   a drop. Add exponential-backoff reconnection (socket.io-client
   supports this natively), a visible "reconnecting..." state distinct
   from "waiting for live updates," and a full data refetch on
   reconnect.

2. PRISMA QUERY / INDEX AUDIT: check apps/api/src/routes/*.ts for
   over-fetching — e.g. does GET /api/volunteers include the full
   assignments graph even on list views that only render summary
   fields? Add leaner queries for list endpoints, reserve full includes
   for :id detail routes. Cross-check prisma/schema.prisma's @@index
   declarations against actual WHERE/ORDER BY usage.

3. IMAGE OPTIMIZATION: the login page's hero gallery (apps/web/app/
   page.tsx, kept from before Phase 5) uses raw <img> tags instead of
   next/image, loading large unoptimized JPEGs at full resolution.
   Convert to next/image with priority on the first visible image.

4. LIGHTHOUSE PASS: run Lighthouse (mobile + desktop) against /, /hub,
   and /volunteer/home post-changes, address the top opportunities,
   record before/after scores. Confirm /map's Leaflet bundle and
   /dashboard's Recharts are code-split via next/dynamic(ssr:false),
   matching the pattern page.tsx already used for MapSection.

5. API RESPONSE CACHING: only relevant if redis remains a real
   dependency (previously used only by the deleted dead chat route from
   Phase 1) — check apps/api/package.json first before reintroducing
   anything.

6. AUTH SESSION PERFORMANCE: confirm NextAuth's session strategy
   (Phase 4) isn't adding a noticeable delay to every gated page load —
   JWT session strategy (not database-backed) should be near-instant;
   verify this is what's configured.

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

## Phase 10 — Resume-Readiness Pass

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
