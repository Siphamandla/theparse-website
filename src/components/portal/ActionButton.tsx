"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/portal/action-result";

function Btn({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

/**
 * A one-click action (resend, revoke, remove…) bound to a server action that
 * takes a single id. Shows the result message next to the button.
 */
export default function ActionButton({
  action,
  id,
  label,
  confirm,
  className = "pt-textbtn",
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  id: string;
  label: string;
  confirm?: string;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form
      action={formAction}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Btn label={label} className={className} />
      {state?.message ? (
        <span role="status" style={{ marginLeft: 8, fontSize: 12, color: state.ok ? "var(--pt-ok)" : "var(--pt-bad)" }}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
