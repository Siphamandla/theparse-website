import "server-only";
import type { Filter } from "mongodb";
import type { InviteDoc } from "./db";

export const INVITE_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "rerequested", label: "Re-requested" },
  { key: "accepted", label: "Accepted" },
  { key: "expired", label: "Expired" },
  { key: "revoked", label: "Revoked" },
] as const;
export type InviteFilterKey = (typeof INVITE_FILTERS)[number]["key"];

export const isInviteFilter = (k: unknown): k is InviteFilterKey => INVITE_FILTERS.some((f) => f.key === k);

/** Mongo filter for a status tab. "Expired" is computed: pending links past their expiry. */
export function inviteFilter(status: InviteFilterKey, now = new Date()): Filter<InviteDoc> {
  switch (status) {
    case "pending": return { status: "pending", expiresAt: { $gt: now } };
    case "expired": return { status: "pending", expiresAt: { $lte: now } };
    case "rerequested":
    case "accepted":
    case "revoked": return { status };
    default: return {};
  }
}
