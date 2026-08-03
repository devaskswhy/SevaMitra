export { default } from "next-auth/middleware";

// Scoped to /hub — a route that doesn't exist yet (Phase 5 adds it) — so
// this currently gates nothing live. Phase 5 will expand the matcher to
// cover /dashboard, /zones, /incidents, /volunteers, /reports, /register,
// /map once those are ready to require sign-in. Does not, and must not,
// ever match apps/web/app/volunteer/** (separate phone+OTP persona) or
// any apps/api route.
export const config = {
  matcher: ["/hub/:path*"],
};
