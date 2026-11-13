import "server-only";
import { randomUUID } from "crypto";
import type { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, sessionCookieName, useSecureCookies } from "@/auth";
import { adminEmails, SESSION_MAX_AGE_SECONDS } from "./config";
import { collections, ensureIndexes, type MembershipDoc, type OrganizationDoc, type UserDoc } from "./db";

export type CurrentUser = UserDoc & { staff: boolean; displayName: string };

/** The signed-in user, or null. Cached for the duration of one request. */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  void ensureIndexes();
  const c = await collections();
  const user = await c.users.findOne({ email });
  if (!user) return null;
  return {
    ...user,
    staff: user.role === "admin" || adminEmails().includes(email),
    displayName: user.name || email,
  };
});

/** For /admin: theParse staff only. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/portal/signin?next=/admin");
  if (!user.staff) redirect("/portal");
  return user;
}

export type MemberContext = {
  user: CurrentUser;
  membership: MembershipDoc;
  org: OrganizationDoc;
};

/**
 * For /portal: the user and the organisation they belong to.
 * Returns null when the user has no organisation (e.g. staff, or a removed member).
 */
export const memberContext = cache(async (): Promise<MemberContext | null> => {
  const user = await currentUser();
  if (!user) return null;
  const c = await collections();
  // Phase 1: one organisation per person. The earliest membership wins.
  const membership = await c.memberships.findOne({ userId: user._id }, { sort: { createdAt: 1 } });
  if (!membership) return null;
  const org = await c.orgs.findOne({ _id: membership.orgId });
  if (!org) return null;
  return { user, membership, org };
});

export async function requireMember(): Promise<MemberContext> {
  const user = await currentUser();
  if (!user) redirect("/portal/signin");
  const ctx = await memberContext();
  if (!ctx) redirect(user.staff ? "/admin" : "/portal/signin?error=NoOrganisation");
  return ctx;
}

export const canManageTeam = (role: MembershipDoc["role"]) => role === "owner" || role === "admin";

/**
 * Signs a user in directly (after they accept an invite, which already proved
 * they own the address). Writes an Auth.js database session and its cookie.
 */
export async function startSession(userId: ObjectId) {
  const c = await collections();
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await c.sessions.insertOne({ sessionToken, userId, expires });
  cookies().set(sessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies,
    expires,
  });
}
