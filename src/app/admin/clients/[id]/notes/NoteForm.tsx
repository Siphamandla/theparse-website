"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/portal/SubmitButton";
import type { ActionResult } from "@/lib/portal/action-result";
import { addNote } from "../../../actions";

export default function NoteForm({ orgId }: { orgId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState(async (prev: ActionResult, fd: FormData) => {
    const res = await addNote(prev, fd);
    if (res?.ok) ref.current?.reset();
    return res;
  }, null);
  return (
    <form ref={ref} action={action} className="pt-form" style={{ gap: 10 }}>
      <input type="hidden" name="orgId" value={orgId} />
      <label className="pt-sr" htmlFor="note">Add a note</label>
      <textarea className="pt-input" id="note" name="text" rows={3} placeholder="Add a note…" required maxLength={4000} />
      <div className="pt-row">
        <SubmitButton pendingLabel="Saving…" className="pt-ghost">Add note</SubmitButton>
        {state && !state.ok ? <span role="alert" style={{ fontSize: 13, color: "var(--pt-bad)" }}>{state.message}</span> : null}
      </div>
    </form>
  );
}
