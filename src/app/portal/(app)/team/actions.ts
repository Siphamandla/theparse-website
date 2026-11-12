"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import { siteUrl } from "@/lib/portal/config";
import { collections, toObjectId } from "@/lib/portal/db";
import { notifyStaff } from "@/lib/portal/email";
import { isEmail, normaliseEmail, roleLabel } from "@/lib/portal/format";
import { checkTeamEmails, createTeamInvite, resendInvite, revokeInvite } from "@/lib/portal/invites";
import { canManageTeam, requireMember } from "@/lib/portal/session";

/** Every team action: signed in, and Owner or Admin of the organisation. */
async function manager() {
  const ctx = await requireMember();
  if (!canManageTeam(ctx.membership.role)) throw new Error("Not allowed");
  const actor = { userId: ctx.user._id, name: ctx.user.displayName, staff: false };
  return { ...ctx, actor };
}

export async function inviteColleague(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { org, user, actor } = await manager();
  const email = normaliseEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const role = formData.get("role") === "admin" ? "admin" : "member";
  if (!isEmail(email)) return fail("Enter a valid email address.");
  const error = await checkTeamEmails(org._id, [email], user.email);
  if (error) return fail(error);

  const { emailed } = await createTeamInvite({ orgId: org._id, orgName: org.name, email, name: name || undefined, role, by: actor });
  await notifyStaff(`${org.name} added a team member`, [`${user.displayName} invited ${email} as ${roleLabel[role]}.`], {
    url: `${siteUrl()}/admin/clients/${org._id.toString()}`,
    label: "View client",
  });
  revalidatePath("/portal/team");
  return emailed ? ok(`Invite sent to ${email}.`) : fail(`Invite created, but the email to ${email} failed. Try "Resend".`);
}

/** Resend or revoke only invites that belong to this organisation. */
async function ownInvite(formData: FormData) {
  const { org, actor } = await manager();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const invite = id ? await c.invites.findOne({ _id: id, orgId: org._id, type: "team" }) : null;
  return { invite, actor };
}

export async function resendColleagueInvite(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { invite, actor } = await ownInvite(formData);
  if (!invite) return fail("Not found");
  const res = await resendInvite(invite._id, actor);
  revalidatePath("/portal/team");
  return res.ok ? ok("Sent") : fail(res.error);
}

export async function revokeColleagueInvite(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { invite, actor } = await ownInvite(formData);
  if (!invite) return fail("Not found");
  await revokeInvite(invite._id, actor);
  revalidatePath("/portal/team");
  return ok("Revoked");
}

export async function changeRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { org, membership: me, actor } = await manager();
  const id = toObjectId(formData.get("id"));
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const c = await collections();
  const target = id ? await c.memberships.findOne({ _id: id, orgId: org._id }) : null;
  if (!target) return fail("Not found");
  if (target.role === "owner") return fail("The owner's role can't be changed.");
  if (target._id.equals(me._id)) return fail("You can't change your own role.");
  await c.memberships.updateOne({ _id: target._id }, { $set: { role } });
  await audit({ orgId: org._id, actor, action: "member.role_changed", detail: roleLabel[role] });
  revalidatePath("/portal/team");
  return ok("Saved");
}

export async function removeMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { org, membership: me, actor } = await manager();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const target = id ? await c.memberships.findOne({ _id: id, orgId: org._id }) : null;
  if (!target) return fail("Not found");
  if (target.role === "owner") return fail("The owner can't be removed.");
  if (target._id.equals(me._id)) return fail("You can't remove yourself.");
  const u = await c.users.findOne({ _id: target.userId });
  await c.memberships.deleteOne({ _id: target._id });
  // End their sessions so access stops immediately.
  await c.sessions.deleteMany({ userId: target.userId });
  await audit({ orgId: org._id, actor, action: "member.removed", detail: u?.email });
  revalidatePath("/portal/team");
  return ok("Removed");
}
