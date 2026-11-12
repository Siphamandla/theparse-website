import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import clientPromise from "@/lib/mongodb";
import { adminEmails, DB_NAME, SESSION_MAX_AGE_SECONDS, siteUrl } from "@/lib/portal/config";
import { collections } from "@/lib/portal/db";
import { sendSignInEmail } from "@/lib/portal/email";

/** Both Auth.js and the onboarding auto sign-in must agree on the cookie name. */
export const useSecureCookies = siteUrl().startsWith("https://");
export const sessionCookieName = `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`;

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const authProviders = { google: googleEnabled };

/**
 * Client portal authentication (Auth.js v5).
 *
 * - Sign-in by emailed magic link (sent through Resend), plus Google if configured.
 * - Invite-only: an address can sign in only if it already has a portal account
 *   (created when an invite is accepted) or is listed in PORTAL_ADMIN_EMAILS.
 * - Database sessions in MongoDB, so sessions can be revoked server-side.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, { databaseName: DB_NAME }),
  session: { strategy: "database", maxAge: SESSION_MAX_AGE_SECONDS },
  trustHost: true,
  useSecureCookies,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
      sendVerificationRequest: ({ identifier, url }) => sendSignInEmail(identifier, url),
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
  ],
  pages: {
    signIn: "/portal/signin",
    verifyRequest: "/portal/signin?sent=1",
    error: "/portal/signin",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      if (adminEmails().includes(email)) return true;
      const c = await collections();
      const existing = await c.users.findOne({ email });
      return existing ? true : "/portal/signin?error=NoAccount";
    },
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
