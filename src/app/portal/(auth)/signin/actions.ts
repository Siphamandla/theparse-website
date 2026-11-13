"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { fail, type ActionResult } from "@/lib/portal/action-result";
import { adminEmails } from "@/lib/portal/config";
import { collections } from "@/lib/portal/db";
import { isEmail, normaliseEmail } from "@/lib/portal/format";

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

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeNext(formData.get("next")) });
}
