"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import type { ActionResult } from "@/lib/portal/action-result";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

/** Email + name + role row that invites one person to an organisation. */
export default function TeamInviteForm({
  action,
  orgId,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  orgId?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(async (prev: ActionResult, fd: FormData) => {
    const res = await action(prev, fd);
    if (res?.ok) ref.current?.reset();
    return res;
  }, null);
  return (
    <form ref={ref} action={formAction} className="pt-form" style={{ gap: 12 }}>
      {orgId ? <input type="hidden" name="orgId" value={orgId} /> : null}
      <div className="pt-team-row">
        <input className="pt-input grow2" name="email" type="email" required aria-label="Email" placeholder="colleague@company.com" />
        <input className="pt-input grow1" name="name" aria-label="Name" placeholder="Name (optional)" />
        <select className="pt-input role" name="role" aria-label="Role" defaultValue="member">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <SubmitButton pendingLabel="Sending…" className="pt-btn sm" style={{ minHeight: 46 }}>Send invite</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
