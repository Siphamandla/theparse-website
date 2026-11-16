"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { fail, type ActionResult } from "@/lib/portal/action-result";
import { adminEmails } from "@/lib/portal/config";
import { db, collections } from "@/lib/portal/db";
import { isEmail, normaliseEmail } from "@/lib/portal/format";
import { startSession } from "@/lib/portal/session";
import { consumeSignInCode } from "@/lib/portal/signin-codes";

/** Only same-site paths under /portal or /admin are allowed as a post-sign-in destination. */
function safeNext(value: FormDataEntryValue | null) {
  const v = String(value ?? "");
  return /^\/(portal|admin)(\/[\w\-/]*)?$/.test(v) ? v : "/portal";
}

export async function requestMagicLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = normaliseEmail(formData.get("email"));
  if (!isEmail(email)) return fail("Enter a valid email address.");

  // Don't reveal whether an address has an account: unknown addresses see the same
  // "check your email" screen, but no email is sent.
  const c = await collections();
  const known = adminEmails().includes(email) || (await c.users.countDocuments({ email }, { limit: 1 })) > 0;
  if (!known) redirect("/portal/signin?sent=1");

  try {
    await signIn("resend", { email, redirectTo: safeNext(formData.get("next")) });
  } catch (err) {
    if (err instanceof AuthError) {
      console.error("❌ [Portal] Magic link failed", err.type, err.message);
      return fail("We couldn't send the sign-in email. Please try again in a minute.");
    }
    throw err; // Next.js redirect
  }
  return null;
}

/**
 * Signs in with the 6-digit code from the sign-in email. Same rules as the link: invite-only
 * (an existing portal account, or a staff address). A wrong, expired or used-up code and an
 * unknown address all get the same message, so this can't be used to find accounts.
 */
export async function signInWithCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = normaliseEmail(formData.get("email"));
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!isEmail(email)) return fail("Enter the email address you asked for the code with.");
  if (code.length !== 6) return fail("Enter the 6-digit code from the email.");

  const wrong = fail("That code is wrong or has expired. Check the latest email, or send a new code.");
  if (!(await consumeSignInCode(email, code))) return wrong;

  const c = await collections();
  const staff = adminEmails().includes(email);
  let user = await c.users.findOne({ email });
  if (!user && staff) {
    // Staff listed in PORTAL_ADMIN_EMAILS may not have an account yet; the link would create one too.
    const { insertedId } = await c.users.insertOne({ email, emailVerified: new Date(), createdAt: new Date() } as never);
    user = await c.users.findOne({ _id: insertedId });
  }
  if (!user) return wrong;
  if (!user.emailVerified) await c.users.updateOne({ _id: user._id }, { $set: { emailVerified: new Date() } });

  // The code was used, so the link in the same email shouldn't work any more.
  await (await db()).collection("verification_tokens").deleteMany({ identifier: email });
  await startSession(user._id);

  const next = safeNext(formData.get("next"));
  redirect(staff && next === "/portal" ? "/admin" : next);
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeNext(formData.get("next")) });
}
