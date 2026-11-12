"use client";

import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import { requestMagicLink } from "./actions";

/** Remembered in this tab only, so the "check your email" view can show it and resend. */
export const LAST_EMAIL_KEY = "tp-portal-signin-email";

export default function SignInForm({ next }: { next?: string }) {
  const [state, action] = useFormState(requestMagicLink, null);
  return (
    <form
      action={action}
      className="pt-form"
      style={{ gap: 14 }}
      onSubmit={(e) => {
        try {
          const email = new FormData(e.currentTarget).get("email");
          sessionStorage.setItem(LAST_EMAIL_KEY, String(email ?? ""));
        } catch {}
      }}
    >
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="pt-label" htmlFor="email">Work email</label>
        <input className="pt-input" id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required autoFocus />
      </div>
      <SubmitButton pendingLabel="Sending…">Email me a sign-in link</SubmitButton>
    </form>
  );
}
