"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/portal/SubmitButton";
import type { ActionResult } from "@/lib/portal/action-result";
import { setRegNumber } from "../../actions";

/** The client's registration number, with an inline edit form for staff. */
export default function RegNumberField({ orgId, value }: { orgId: string; value?: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(async (prev: ActionResult, fd: FormData) => {
    const res = await setRegNumber(prev, fd);
    if (res?.ok) setEditing(false);
    return res;
  }, null);

  if (!editing) {
    return (
      <div className="pt-row" style={{ gap: 10 }}>
        {value ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span> : <span className="pt-muted">Not given</span>}
        <button type="button" className="pt-link" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
          {value ? "Edit" : "Add"}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="pt-form" style={{ gap: 8 }}>
      <input type="hidden" name="orgId" value={orgId} />
      <label className="pt-sr" htmlFor="regNumber">Business registration number</label>
      <input
        className="pt-input"
        id="regNumber"
        name="regNumber"
        defaultValue={value}
        placeholder="e.g. 2019/123456/07"
        maxLength={40}
        pattern="[A-Za-z0-9][A-Za-z0-9 /.\-]{1,39}"
        title="Letters, numbers, spaces, / . or -"
        autoComplete="off"
        autoFocus
      />
      <div className="pt-row" style={{ gap: 8 }}>
        <SubmitButton pendingLabel="Saving…" className="pt-ghost">Save</SubmitButton>
        <button type="button" className="pt-link" style={{ fontSize: 13 }} onClick={() => setEditing(false)}>Cancel</button>
        {state && !state.ok ? <span role="alert" style={{ fontSize: 13, color: "var(--pt-bad)" }}>{state.message}</span> : null}
      </div>
    </form>
  );
}
