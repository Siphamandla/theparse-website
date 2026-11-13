"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import { requestMagicLink } from "./actions";
import { LAST_EMAIL_KEY } from "./SignInForm";

const RESEND_AFTER_SECONDS = 45;

/** "Check your inbox", with a resend button that unlocks after a short wait. */
export default function SentPanel({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);
  const [state, action] = useFormState(requestMagicLink, null);

  useEffect(() => {
    try {
      setEmail(sessionStorage.getItem(LAST_EMAIL_KEY) ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const clock = `0:${String(wait).padStart(2, "0")}`;

  return (
    <>
      <div className="pt-mail-tile" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>
      <div>
        <h1 className="pt-h1">Check your inbox</h1>
        <p className="pt-sub">
          If {email ? <b style={{ color: "var(--text)" }}>{email}</b> : "that address"} has a portal account, a sign-in link is on its way. It works once and
          expires in 24 hours.
        </p>
      </div>
      <ol className="pt-tips">
        <li><span>1</span><span>Open the email from theParse on this device.</span></li>
        <li><span>2</span><span>Click <b>Sign in</b>. You&apos;ll land in your portal.</span></li>
        <li><span>3</span><span>Nothing after a few minutes? Check your spam or promotions folder.</span></li>
      </ol>
      <FormMessage state={state} />
      <div className="pt-row">
        {email ? (
          <form action={action} onSubmit={() => setWait(RESEND_AFTER_SECONDS)}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next ?? ""} />
            <button type="submit" className="pt-ghost" style={{ width: "auto", padding: "0 20px", fontSize: 14 }} disabled={wait > 0}>
              {wait > 0 ? `Resend link in ${clock}` : "Resend link"}
            </button>
          </form>
        ) : null}
        <Link className="pt-link" style={{ fontSize: 14 }} href={next ? `/portal/signin?next=${encodeURIComponent(next)}` : "/portal/signin"}>
          Use a different email
        </Link>
      </div>
    </>
  );
}
