import "server-only";
import type { ObjectId } from "mongodb";
import { audit } from "./audit";
import { INVITE_DAYS_DEFAULT, MAX_TEAM_SIZE, siteUrl } from "./config";
import { collections, type InviteDoc, type MemberRole } from "./db";
import { sendClientInviteEmail, sendTeamInviteEmail } from "./email";
import { inviteDisplayStatus } from "./format";
import { hashToken, newToken } from "./tokens";

type Actor = InviteDoc["invitedBy"];

const DAY = 24 * 60 * 60 * 1000;
const inviteUrl = (token: string) => `${siteUrl()}/portal/invite/${token}`;

/** Looks up an invite from the token in a link. */
export async function findInviteByToken(token: string) {
  if (!token || token.length > 100) return null;
  const c = await collections();
  const invite = await c.invites.findOne({ tokenHash: hashToken(token) });
  if (!invite) return null;
  return { invite, status: inviteDisplayStatus(invite) };
}

/* -------------------------------------------------------- client invites */

export async function createClientInvite(input: {
  email: string;
  name?: string;
  company?: string;
  regNumber?: string;
  services?: string[];
  note?: string;
  days?: number;
  existingClient?: boolean;
  leadId?: ObjectId;
  by: Actor;
}) {
  const c = await collections();
  const token = newToken();
  const now = new Date();
  const days = input.days || INVITE_DAYS_DEFAULT;

  // One live link per address: older unused client invites stop working.
  await c.invites.updateMany(
    { type: "client", email: input.email, status: { $in: ["pending", "rerequested"] } },
    { $set: { status: "revoked" } },
  );

  const doc: Omit<InviteDoc, "_id"> = {
    type: "client",
    email: input.email,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + days * DAY),
    status: "pending",
    createdAt: now,
    lastSentAt: now,
    invitedBy: input.by,
    prefill: { name: input.name, company: input.company, regNumber: input.regNumber, services: input.services ?? [] },
    note: input.note,
    existingClient: input.existingClient,
    leadId: input.leadId,
  };
  const { insertedId } = await c.invites.insertOne(doc as InviteDoc);

  const sent = await sendClientInviteEmail({
    to: input.email,
    name: input.name,
    company: input.company,
    inviterName: input.by.name,
    note: input.note,
    url: inviteUrl(token),
    expiresAt: doc.expiresAt,
  });

  if (input.leadId) await c.leads.updateOne({ _id: input.leadId }, { $set: { status: "invited" } });
  await audit({ actor: input.by, action: "invite.client.sent", detail: input.email });
  return { id: insertedId, emailed: sent.success };
}

/**
 * Sends a fresh link for an existing invite (new token, new expiry).
 * Works for pending, expired and re-requested invites.
 */
export async function resendInvite(inviteId: ObjectId, by: Actor) {
  const c = await collections();
  const invite = await c.invites.findOne({ _id: inviteId });
  if (!invite) return { ok: false as const, error: "Invite not found." };
  if (invite.status === "accepted") return { ok: false as const, error: "This invite was already accepted." };
  if (invite.status === "revoked") return { ok: false as const, error: "This invite was revoked. Send a new one instead." };

  const token = newToken();
  const days = Math.max(1, Math.round((invite.expiresAt.getTime() - invite.lastSentAt.getTime()) / DAY)) || INVITE_DAYS_DEFAULT;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * DAY);
  await c.invites.updateOne(
    { _id: invite._id },
    { $set: { tokenHash: hashToken(token), expiresAt, lastSentAt: now, status: "pending" } },
  );

  let emailed;
  if (invite.type === "client") {
    emailed = await sendClientInviteEmail({
      to: invite.email,
      name: invite.prefill?.name,
      company: invite.prefill?.company,
      inviterName: by.name,
      note: invite.note,
      url: inviteUrl(token),
      expiresAt,
    });
  } else {
    const org = invite.orgId ? await c.orgs.findOne({ _id: invite.orgId }) : null;
    if (!org) return { ok: false as const, error: "Organisation not found." };
    emailed = await sendTeamInviteEmail({
      to: invite.email,
      name: invite.name,
      orgName: org.name,
      inviterName: by.name,
      role: invite.role ?? "member",
      url: inviteUrl(token),
      expiresAt,
    });
  }
  await audit({ orgId: invite.orgId, actor: by, action: "invite.resent", detail: invite.email });
  return { ok: true as const, emailed: emailed.success };
}

export async function revokeInvite(inviteId: ObjectId, by: Actor) {
  const c = await collections();
  const res = await c.invites.findOneAndUpdate(
    { _id: inviteId, status: { $in: ["pending", "rerequested"] } },
    { $set: { status: "revoked" } },
  );
  if (res) await audit({ orgId: res.orgId, actor: by, action: "invite.revoked", detail: res.email });
  return Boolean(res);
}

/* ---------------------------------------------------------- team invites */

/** Members plus live (pending, unexpired) team invites. */
export async function seatsUsed(orgId: ObjectId) {
  const c = await collections();
  const [members, pending] = await Promise.all([
    c.memberships.countDocuments({ orgId }),
    c.invites.countDocuments({ orgId, type: "team", status: "pending", expiresAt: { $gt: new Date() } }),
  ]);
  return members + pending;
}

/** Checks a list of colleague emails against the organisation. Returns an error message or null. */
export async function checkTeamEmails(orgId: ObjectId | null, emails: string[], ownerEmail?: string) {
  const c = await collections();
  const seen = new Set<string>();
  for (const e of emails) {
    if (seen.has(e)) return `${e} is listed twice.`;
    if (ownerEmail && e === ownerEmail) return "You don't need to add your own email.";
    seen.add(e);
  }
  if (!orgId) return null;
  const used = await seatsUsed(orgId);
  if (used + emails.length > MAX_TEAM_SIZE) return `Your team can have up to ${MAX_TEAM_SIZE} people (including pending invites).`;

  const users = await c.users.find({ email: { $in: emails } }).toArray();
  if (users.length) {
    const already = await c.memberships.findOne({ orgId, userId: { $in: users.map((u) => u._id) } });
    if (already) {
      const u = users.find((x) => x._id.equals(already.userId));
      return `${u?.email} is already on the team.`;
    }
  }
  const dup = await c.invites.findOne({ orgId, type: "team", email: { $in: emails }, status: "pending", expiresAt: { $gt: new Date() } });
  if (dup) return `${dup.email} already has a pending invite.`;
  return null;
}

export async function createTeamInvite(input: {
  orgId: ObjectId;
  orgName: string;
  email: string;
  name?: string;
  role: Exclude<MemberRole, "owner">;
  by: Actor;
}) {
  const c = await collections();
  const token = newToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_DAYS_DEFAULT * DAY);
  await c.invites.insertOne({
    type: "team",
    email: input.email,
    name: input.name,
    orgId: input.orgId,
    role: input.role,
    tokenHash: hashToken(token),
    expiresAt,
    status: "pending",
    createdAt: now,
    lastSentAt: now,
    invitedBy: input.by,
  } as InviteDoc);
  const sent = await sendTeamInviteEmail({
    to: input.email,
    name: input.name,
    orgName: input.orgName,
    inviterName: input.by.name,
    role: input.role,
    url: inviteUrl(token),
    expiresAt,
  });
  await audit({ orgId: input.orgId, actor: input.by, action: "invite.team.sent", detail: `${input.email} (${input.role})` });
  return { emailed: sent.success };
}
