import type { ActionResult } from "@/lib/portal/action-result";

export default function FormMessage({ state }: { state: ActionResult }) {
  if (!state?.message) return null;
  return (
    <div className={`pt-alert ${state.ok ? "success" : "error"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </div>
  );
}
