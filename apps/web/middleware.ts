import { withAuth } from "next-auth/middleware";

// Redirect unauthenticated visits to our own reframed login page (/)
// instead of NextAuth's default /api/auth/signin page.
export default withAuth({
  pages: {
    signIn: "/",
  },
});

// Gates every admin/coordinator feature page added across Phases 3-5.
// Deliberately does NOT match apps/web/app/volunteer/** (separate
// phone+OTP persona, its own already-working auth story) or any
// apps/api route.
export const config = {
  matcher: [
    "/hub/:path*",
    "/dashboard/:path*",
    "/zones/:path*",
    "/incidents/:path*",
    "/volunteers/:path*",
    "/reports/:path*",
    "/register/:path*",
    "/map/:path*",
  ],
};
