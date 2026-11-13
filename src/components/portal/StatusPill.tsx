import { inviteStatusLabel, orgStatusLabel, type DisplayInviteStatus } from "@/lib/portal/format";

const inviteTone: Record<DisplayInviteStatus, string> = {
  pending: "warn",
  accepted: "ok",
  expired: "neutral",
  revoked: "bad",
  rerequested: "acc",
};
const orgTone = { needs_review: "acc", active: "ok", archived: "neutral" } as const;

export function InvitePill({ status }: { status: DisplayInviteStatus }) {
  return <span className={`pt-pill ${inviteTone[status]}`}>{inviteStatusLabel[status]}</span>;
}

export function OrgPill({ status }: { status: keyof typeof orgStatusLabel }) {
  return <span className={`pt-pill ${orgTone[status]}`}>{orgStatusLabel[status]}</span>;
}

/** Dot + label, for dense tables. */
export function InviteStatus({ status }: { status: DisplayInviteStatus }) {
  return <span className={`pt-status ${inviteTone[status]}`}>{inviteStatusLabel[status]}</span>;
}

export function OrgStatus({ status }: { status: keyof typeof orgStatusLabel }) {
  return <span className={`pt-status ${orgTone[status]}`}>{orgStatusLabel[status]}</span>;
}
