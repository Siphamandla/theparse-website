"use client";

import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import { requestNewLink } from "../actions";

export default function RequestLinkForm({ token, alreadyRequested }: { token: string; alreadyRequested: boolean }) {
  const [state, action] = useFormState(
    requestNewLink,
    alreadyRequested ? { ok: true, message: "You've already asked for a new link. theParse will email it to you shortly." } : null,
  );
  return (
    <form action={action} className="pt-form" style={{ alignItems: "center", width: "100%" }}>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      {!state?.ok ? <SubmitButton pendingLabel="Sending…">Request a new link</SubmitButton> : null}
    </form>
  );
}
