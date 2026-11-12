import { serviceOptions } from "@/data/site";

/** Formatting helpers shared by server and client components. */

export function formatDate(d: Date | string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" });
}

/** Full timestamp for stored records: "12 Nov 2026, 14:32" (South African time). */
export function formatTimestamp(d: Date | string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  });
}

export function formatDateTime(d: Date | string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(nameOrEmail: string) {
  const s = (nameOrEmail || "?").split("@")[0];
  const parts = s.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const serviceLabels = new Map(serviceOptions.map((s) => [s.value, s.label]));
export const serviceLabel = (value: string) => serviceLabels.get(value) ?? value;
export const isKnownService = (value: string) => serviceLabels.has(value);

export type DisplayInviteStatus = "pending" | "accepted" | "expired" | "revoked" | "rerequested";

export function inviteDisplayStatus(inv: { status: string; expiresAt: Date | string }): DisplayInviteStatus {
  if (inv.status === "pending" && new Date(inv.expiresAt).getTime() < Date.now()) return "expired";
  return inv.status as DisplayInviteStatus;
}

export const inviteStatusLabel: Record<DisplayInviteStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  revoked: "Revoked",
  rerequested: "Re-requested",
};

export const orgStatusLabel = { needs_review: "Needs review", active: "Active", archived: "Archived" } as const;

export const roleLabel = { owner: "Owner", admin: "Admin", member: "Member" } as const;

export const normaliseEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

/** "today", "in 3 days", "2 days ago" (calendar-ish, rounded to whole days). */
export function relativeDays(d: Date | string, now = Date.now()) {
  const days = Math.round((new Date(d).getTime() - now) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
/** R 12 500,00 */
export const formatMoney = (cents: number) => zar.format(cents / 100);

/** "12 500.50" / "12500,5" / "R12,500" → cents, or null if it isn't a positive amount. */
export function parseAmountToCents(input: unknown): number | null {
  let s = String(input ?? "").replace(/[R\s\u00a0]/gi, "");
  // Treat a trailing ",dd" as decimals (South African style), other commas as thousands separators.
  s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 && cents < 1e12 ? cents : null;
}

export const paidCents = (inv: { payments?: { amountCents: number }[] }) => (inv.payments ?? []).reduce((s, p) => s + p.amountCents, 0);
export const balanceCents = (inv: { amountCents: number; payments?: { amountCents: number }[] }) => Math.max(0, inv.amountCents - paidCents(inv));

export type InvoiceDisplayStatus = "due" | "part_paid" | "overdue" | "paid" | "void";
export function invoiceDisplayStatus(inv: { status: string; dueAt: Date | string; amountCents: number; payments?: { amountCents: number }[] }): InvoiceDisplayStatus {
  if (inv.status === "void") return "void";
  if (inv.status === "paid" || balanceCents(inv) === 0) return "paid";
  const endOfDue = new Date(inv.dueAt);
  endOfDue.setHours(23, 59, 59, 999);
  if (endOfDue.getTime() < Date.now()) return "overdue";
  return paidCents(inv) > 0 ? "part_paid" : "due";
}
export const invoiceStatusLabel: Record<InvoiceDisplayStatus, string> = { due: "Due", part_paid: "Part paid", overdue: "Overdue", paid: "Paid", void: "Cancelled" };
export const invoiceTone: Record<InvoiceDisplayStatus, string> = { due: "warn", part_paid: "info", overdue: "bad", paid: "ok", void: "neutral" };
export const paymentMethodLabel = { eft: "EFT", card: "Card", cash: "Cash", other: "Other" } as const;

export const contractStatusLabel = { awaiting_signature: "Awaiting acceptance", signed: "Accepted", void: "Cancelled" } as const;
export const contractTone = { awaiting_signature: "warn", signed: "ok", void: "neutral" } as const;

/**
 * Company registration number, tidied: trimmed, single spaces, upper case.
 * Lenient on format (CIPC "2019/123456/07", or foreign numbers), strict on characters.
 * Returns "" when empty, null when it isn't a plausible number.
 */
export function normaliseRegNumber(v: unknown): string | null {
  const s = String(v ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  if (!s) return "";
  return /^[A-Z0-9][A-Z0-9 /.\-]{1,39}$/.test(s) ? s : null;
}
