"use client";

import { useFormState } from "react-dom";
import type { ActionResult } from "@/lib/portal/action-result";

/** Changes a member's role as soon as a new one is picked. */
export default function RoleSelect({
  action,
  id,
  role,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  id: string;
  role: "admin" | "member";
}) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <select
        name="role"
        aria-label="Role"
        defaultValue={role}
        className="pt-input"
        style={{ minHeight: 34, width: "auto", padding: "0 8px", fontSize: 13 }}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      {state?.message ? (
        <span role="status" style={{ fontSize: 12, color: state.ok ? "var(--pt-ok)" : "var(--pt-bad)" }}>{state.message}</span>
      ) : null}
    </form>
  );
}
