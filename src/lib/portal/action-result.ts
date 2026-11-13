/** What every portal/admin form action returns to its form. */
export type ActionResult = { ok: boolean; message: string } | null;

export const ok = (message: string): ActionResult => ({ ok: true, message });
export const fail = (message: string): ActionResult => ({ ok: false, message });
