"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import { requestMagicLink, signInWithCode } from "./actions";
import { LAST_EMAIL_KEY } from "./SignInForm";

const RESEND_AFTER_SECONDS = 45;

/** "Check your inbox": type the emailed code (or click the link in it), with a resend after a short wait. */
export default function SentPanel({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [wait, setWait] = useState(RESEND_AFTER_SECONDS);
  const [state, action] = useFormState(requestMagicLink, null);
  const [codeState, codeAction] = useFormState(signInWithCode, null);

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
          If {email ? <b style={{ color: "var(--text)" }}>{email}</b> : "that address"} has a portal account, we&apos;ve emailed a 6-digit code. Enter it
          below, or click <b style={{ color: "var(--text)" }}>Sign in</b> in the email.
        </p>
      </div>

      <form action={codeAction} className="pt-form" style={{ gap: 14 }}>
        <FormMessage state={codeState} />
        <input type="hidden" name="next" value={next ?? ""} />
        {email ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          // Opened in a new tab, so we don't know the address: ask for it.
          <div>
            <label className="pt-label" htmlFor="code-email">Work email</label>
            <input className="pt-input" id="code-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          </div>
        )}
        <div>
          <label className="pt-label" htmlFor="code">Sign-in code</label>
          <input
            className="pt-input pt-code-input"
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="123456"
            required
            autoFocus
          />
          <span className="pt-hint">The code expires in 10 minutes. The link in the email works for 24 hours.</span>
        </div>
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>

      <ol className="pt-tips">
        <li><span>1</span><span>Open the email from theParse. It can be on any device.</span></li>
        <li><span>2</span><span>Type the code here, or click <b>Sign in</b> in the email on this device.</span></li>
        <li><span>3</span><span>Nothing after a few minutes? Check your spam or promotions folder.</span></li>
      </ol>
      <FormMessage state={state} />
      <div className="pt-row">
        {email ? (
          <form action={action} onSubmit={() => setWait(RESEND_AFTER_SECONDS)}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next ?? ""} />
            <button type="submit" className="pt-ghost" style={{ width: "auto", padding: "0 20px", fontSize: 14 }} disabled={wait > 0}>
              {wait > 0 ? `Send a new code in ${clock}` : "Send a new code"}
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
