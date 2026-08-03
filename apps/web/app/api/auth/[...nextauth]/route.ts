import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Admin/coordinator-side auth only. This is a separate persona/flow from
// the volunteer phone+OTP login (apps/web/app/volunteer/**) — the two are
// not merged, and this route has no relationship to the VolunteerSession
// Prisma model. JWT session strategy (default) — no database adapter, no
// schema changes.
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
