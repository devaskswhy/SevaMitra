# Accessibility Audit — Phase 9

Full-app pass against SevaMitra's own older-age-friendly bar (48px+ touch
targets, 16px+ base font, high contrast) and WCAG 2.1 AA. Method: an
automated `@axe-core/playwright` scan (`wcag2a`+`wcag2aa` rule sets)
across all 14 routes, a real-browser `getBoundingClientRect()` sweep of
every interactive element measuring it against a 48×48px floor, and a
manual review of forms, headings, and keyboard/focus behavior. Every
finding below was reproduced before the fix and re-verified after.

## Shared / app-wide fixes

These affected every page that uses the component or token, so they're
listed once here rather than repeated per page.

- **Viewport pinch-zoom was disabled.** `app/layout.tsx`'s `viewport`
  export set `maximumScale: 1` and `userScalable: false`, blocking
  pinch-zoom entirely — a hard requirement violation for an
  older-age-friendly app. Removed both; zoom now works everywhere.
- **`Badge`'s solid variant failed contrast for 4 of 5 tones.**
  White text on solid saffron/gold/success/warning backgrounds measured
  2.4–3.8:1 (danger was the only tone that passed at 6.6:1). This hit
  every page using `variant="solid"` badges: `/dashboard`, `/zones`,
  `/incidents`, `/reports`, `/shifts`. Fixed by giving each tone its own
  `solidText` (dark `#0D0500` for saffron/gold/success/warning, white
  for danger/neutral — chosen per-tone by actually computing contrast
  against each background, not assumed). Also fixed the `soft` variant's
  danger/warning text, which measured 2.7:1 / 4.3:1 against their tinted
  backgrounds — lightened just those two tones' soft text color
  (`#FF5252` / `#FFA040`) to clear 4.5:1; saffron/gold/success soft text
  already passed and were left unchanged.
- **Hub tile idle bob had no reduced-motion fallback.** The `/hub`
  floating tiles' continuous `hub-tile-float` animation is this app's
  first ambient (non-transient) motion. Moved it from an inline style to
  a `.hub-tile-bob` class and added `@media (prefers-reduced-motion:
  reduce) { animation: none }` in `globals.css`.
- **SevaSahayak chat widget's input had no visible focus indicator.**
  Globally mounted (every page). An inline `outline: 'none'` plus a
  fixed inline `border` blocked the stylesheet's usual focus treatment,
  and the widget's own box-shadow never fired. Replaced with real
  `onFocus`/`onBlur` state driving a visible border-color + box-shadow
  ring, independent of any external cascade quirks.

## Page-by-page

### `/` (login)
- Carousel dot buttons measured 8×8 / 24×8px — the exact regression
  class already fixed once on this same row (`69831a2`). Restructured
  so the button itself is a full 48×48 tap target with the small visual
  dot centered inside as a child `<span>`, instead of shrinking the
  button (and its tap target) to match the dot.
- The "— 01 ABOUT" section-kicker label used `rgba(255,248,238,0.2)` —
  1.7:1 contrast. Raised to `0.55` opacity (5.99:1).
- `Sign in with Google` (hero + About section) verified to keep a
  visible focus ring through the magnetic-hover interaction — confirmed
  live (3px solid outline on focus).

### `/hub`
- No violations found. Tiles are real `role="link"` + `tabIndex={0}`
  elements with Enter-key handling and their accessible name resolves
  correctly to the visible label text (the preview mini-graphics inside
  are non-text, so they don't pollute the accessible name). Confirmed
  keyboard-reachable and screen-reader-announced as designed — no
  changes needed here beyond the shared Badge/reduced-motion fixes.

### `/dashboard`
- `select-name` (critical): the "Select Task" dropdown had a visible
  `<label>` that wasn't programmatically linked. Added matching
  `htmlFor`/`id`.
- `scrollable-region-focusable`: the horizontally-scrolling "Sacred
  Moments" image strip had no way for a keyboard user to focus and
  scroll it. Added `role="region"`, `aria-label`, and `tabIndex={0}`.
- Solid Badge contrast (Zone Status priority pills) — covered by the
  shared Badge fix above.

### `/zones`
- Solid Badge contrast (priority pills) — covered by the shared fix.
  No other violations.

### `/incidents`
- Solid Badge contrast (severity pills) — covered by the shared fix.
- The **Resolved Incidents** cards wrapped everything in `opacity-75`
  to look visually "faded," which pushed already-modest
  `--text-secondary`/`--text-muted` text under 4.5:1 (measured 3.1–4.1:1
  post-fade). The green left-border + "Resolved" badge already convey
  the state unambiguously, so the opacity wrapper was removed rather
  than trying to compensate with even-lighter text colors.

### `/volunteers`
- No violations. The search input only had a placeholder (not a valid
  accessible name on its own) — added `aria-label="Search volunteers by
  name or email"` proactively.
- The skills column truncates to 20 characters with "…" and no way to
  see the full value — added `title={v.skills}` so the full list is
  available on hover/long-press.

### `/reports`
- Solid Badge contrast (leaderboard status pills) — covered by the
  shared fix. No other violations.

### `/register`
- `select-name` (critical) on the Gender and Home State selects —
  same unlinked-label pattern as dashboard, fixed with `htmlFor`/`id`.
  Extended the same fix to every other input on the form (Name, Email,
  Phone, Age, Aadhaar) even though axe didn't flag them individually —
  none had a linked `<label>`, and "all form inputs have properly
  associated labels" was an explicit requirement, not just "whatever
  axe catches."
- The success/error message banner had no live-region role, so a
  screen-reader user wouldn't be notified when it appeared after
  submit. Added `role="alert"`.
- 8 small targets flagged: the skill checkboxes (`w-4 h-4`, 16px).
  **Reviewed, not changed** — each checkbox is wrapped in a `<label>`
  containing the checkbox and its text, so the real click/tap target is
  the whole label row (comfortably >48px tall and wide), not the raw
  16px `<input>` box my measurement script isolated. Enlarging the
  visible checkbox itself to 48px would look broken relative to its
  label text for no functional gain.

### `/map`
- The "Click any zone for details" hint text used
  `rgba(255,248,238,0.3)` — 2.48:1. Raised to `0.55` (matches the same
  fix on `/`'s section label) — now ~6:1.
- Leaflet's default zoom +/- controls measured 30×30px. Overrode via
  `.leaflet-bar a` in `globals.css` to the app's 48px tap-target token.
- The "Leaflet" attribution link (51×14px) is **left as-is** —
  it's the library's required attribution link, WCAG's actual minimum
  target size (2.5.8, AA) is 24×24px not this app's stricter 48px bar,
  and every mapping product on the web ships this exact convention.

### `/shifts`
- Solid Badge contrast (task capacity pills) — covered by the shared
  fix.
- The Start Time / End Time / Task / manual-volunteer selects all had
  unlinked `<label>`s — added `htmlFor`/`id` to each.
- Create-shift and assign-volunteer error/success messages, and the
  double-booking conflict warning, had no live-region role — added
  `role="alert"` to error/conflict text and `role="status"` to the
  success confirmation.

### `/volunteer` (OTP login)
- Phone and OTP inputs had unlinked `<label>`s — fixed with
  `htmlFor`/`id`.
- Error messages (invalid phone, invalid OTP, volunteer not found) had
  no live-region role — added `role="alert"`.
- 1 small target flagged: the inline "Register here" link inside "New
  volunteer? Register here" (91×17px). **Left as-is** — WCAG 2.5.8
  explicitly exempts targets that sit inside a sentence/block of text;
  inflating an inline text link to 48px isn't how any product does this
  and would look broken.

### `/volunteer/home`, `/volunteer/profile`, `/volunteer/report`
- `button-name` (critical): the header back/logout icon buttons (just
  an SVG, no text) had no accessible name. Added `aria-label="Go back"`
  / `aria-label="Log out"`.
- Bottom-nav buttons (Home/Report/Profile) measured ~34–38px wide
  despite being 48px tall (the global `button { min-height:
  var(--tap-target) }` rule covers height but not width). Added
  `minWidth: var(--tap-target)` to each. Also added `aria-current="page"`
  to whichever nav button represents the current page.
- `volunteer/report`: the severity 1-5 picker was a bare row of
  unlabeled buttons — added `role="group"` + `aria-labelledby` tying it
  to the "Severity Level" label, and `aria-pressed`/`aria-label` on each
  button so a screen reader announces "Severity level 3, pressed"
  instead of just "3". Zone/Type selects and the Description textarea
  had unlinked labels — fixed. The submit-failure error banner had no
  live-region role — added `role="alert"`.

## Verified, not touched

- `components/StickyHeader.tsx` has an `outline: none` with no visible
  focus alternative, but it isn't imported or rendered anywhere in the
  app (confirmed via search) — dead code from before Phase 5's
  reframe, out of scope for this pass, no live user impact.
- Heading order, generic form-label association beyond what's listed
  above, and ARIA-role misuse were all covered by the automated axe
  scan and came back clean everywhere except what's listed above.

## Result

- Automated `axe-core` scan (`wcag2a` + `wcag2aa`): **0 violations**
  across all 14 routes, re-verified after every fix above.
- Every interactive element measured ≥48×48px except the three
  documented, WCAG-exempted exceptions above (label-wrapped checkboxes,
  required map attribution, inline text link).
- Pinch-zoom works app-wide.
- The hub's idle animation respects `prefers-reduced-motion`.
- All form inputs across every route have a programmatically associated
  label; every `/hub` tile is keyboard-reachable and
  screen-reader-announced.
