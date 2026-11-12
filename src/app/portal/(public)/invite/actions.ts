"use server";

import { redirect } from "next/navigation";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAX_TEAM_SIZE,
  REREQUEST_COOLDOWN_MINUTES,
  siteUrl,
} from "@/lib/portal/config";
import { collections, type Attachment, type MemberRole, type UserDoc } from "@/lib/portal/db";
import { notifyStaff, sendOnboardingConfirmation } from "@/lib/portal/email";
import { isEmail, isKnownService, normaliseEmail, normaliseRegNumber, roleLabel, serviceLabel } from "@/lib/portal/format";
import { checkTeamEmails, createTeamInvite, findInviteByToken } from "@/lib/portal/invites";
import { startSession } from "@/lib/portal/session";
import { headObject } from "@/lib/portal/storage";

const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

function parseJson<T>(v: FormDataEntryValue | null): T | null {
  try {
    return JSON.parse(String(v ?? "null")) as T;
  } catch {
    return null;
  }
}

/** Finds the user for an address, creating one if needed. Accepting an invite verifies the address. */
async function upsertUser(email: string, name: string): Promise<UserDoc> {
  const c = await collections();
  const now = new Date();
  const user = await c.users.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, name, createdAt: now }, $set: { emailVerified: now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!user) throw new Error("User upsert failed");
  if (!user.name) await c.users.updateOne({ _id: user._id }, { $set: { name } });
  return user;
}

/* ------------------------------------------------- new client onboarding */

export async function submitOnboarding(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const token = str(formData.get("token"), 100);
  const found = await findInviteByToken(token);
  if (!found || found.invite.type !== "client") return fail("This invite link isn't valid.");
  if (found.status !== "pending") return fail("This invite link has expired or was already used. Reload the page for options.");
  const invite = found.invite;

  // --- details
  const name = str(formData.get("name"), 120);
  const company = str(formData.get("company"), 160);
  const regNumber = normaliseRegNumber(formData.get("regNumber"));
  const phone = str(formData.get("phone"), 40);
  const message = str(formData.get("message"), 5000);
  const services = formData.getAll("services").map(String).filter(isKnownService);
  if (!name) return fail("Please enter your full name.");
  if (!company) return fail("Please enter your company name.");
  if (regNumber === null) return fail("That registration number doesn't look right. Use letters, numbers, spaces, / . or -, e.g. 2019/123456/07.");
  if (!services.length) return fail("Pick at least one service.");
  if (!message) return fail("Please tell us a little about your project.");
  if (formData.get("consent") !== "on") return fail("Please accept the terms and privacy policy to continue.");

  // --- attachments: must be this invite's uploads, present in storage, allowed type and size
  const rawFiles = parseJson<{ key: string; name: string }[]>(formData.get("attachments")) ?? [];
  if (!Array.isArray(rawFiles) || rawFiles.length > MAX_ATTACHMENTS) return fail(`You can attach up to ${MAX_ATTACHMENTS} files.`);
  const prefix = `onboarding/${invite._id.toString()}/`;
  const attachments: Attachment[] = [];
  for (const f of rawFiles) {
    if (typeof f?.key !== "string" || !f.key.startsWith(prefix)) return fail("One of the attachments isn't valid. Remove it and try again.");
    const head = await headObject(f.key);
    if (!head || head.size > MAX_ATTACHMENT_BYTES || !ALLOWED_ATTACHMENT_TYPES[head.type]) {
      return fail(`"${String(f.name).slice(0, 80)}" didn't upload properly. Remove it and try again.`);
    }
    attachments.push({ key: f.key, name: String(f.name ?? "file").slice(0, 160), size: head.size, type: head.type });
  }

  // --- colleagues
  const rawTeam = parseJson<{ email: string; name?: string; role?: string }[]>(formData.get("team")) ?? [];
  if (!Array.isArray(rawTeam) || rawTeam.length > MAX_TEAM_SIZE - 1) return fail(`You can add up to ${MAX_TEAM_SIZE - 1} colleagues.`);
  const team = rawTeam
    .map((m) => ({
      email: normaliseEmail(m?.email),
      name: String(m?.name ?? "").trim().slice(0, 120),
      role: (m?.role === "admin" ? "admin" : "member") as Exclude<MemberRole, "owner">,
    }))
    .filter((m) => m.email);
  const badEmail = team.find((m) => !isEmail(m.email));
  if (badEmail) return fail(`"${badEmail.email}" isn't a valid email address.`);
  const teamError = await checkTeamEmails(null, team.map((m) => m.email), invite.email);
  if (teamError) return fail(teamError);

  // --- claim the invite (exactly once, even if the form is submitted twice)
  const c = await collections();
  const claimed = await c.invites.findOneAndUpdate(
    { _id: invite._id, status: "pending", tokenHash: invite.tokenHash, expiresAt: { $gt: new Date() } },
    { $set: { status: "accepted", acceptedAt: new Date() } },
  );
  if (!claimed) return fail("This invite link was already used. Try signing in instead.");

  const now = new Date();
  const user = await upsertUser(invite.email, name);
  const { insertedId: orgId } = await c.orgs.insertOne({
    name: company,
    regNumber: regNumber || undefined,
    phone: phone || undefined,
    status: invite.existingClient ? "active" : "needs_review",
    createdAt: now,
    invitedBy: invite.invitedBy.userId ? { userId: invite.invitedBy.userId, name: invite.invitedBy.name } : undefined,
  } as never);
  await c.memberships.insertOne({ orgId, userId: user._id, role: "owner", createdAt: now } as never);
  await c.invites.updateOne({ _id: invite._id }, { $set: { orgId } });
  await c.submissions.insertOne({
    orgId,
    userId: user._id,
    inviteId: invite._id,
    name,
    email: invite.email,
    company,
    regNumber: regNumber || undefined,
    phone: phone || undefined,
    services,
    message,
    attachments,
    createdAt: now,
  } as never);

  const actor = { userId: user._id, name, staff: false };
  await audit({ orgId, actor, action: "onboarding.completed", detail: `${attachments.length} attachment(s)` });

  for (const m of team) {
    await createTeamInvite({ orgId, orgName: company, email: m.email, name: m.name || undefined, role: m.role, by: actor });
  }

  await notifyStaff(
    `${company} completed onboarding`,
    [
      `${name} (${invite.email}) completed their details.`,
      `Services: ${services.map(serviceLabel).join(", ")}`,
      `Attachments: ${attachments.length}`,
      team.length ? `Team members invited: ${team.map((m) => `${m.email} (${roleLabel[m.role]})`).join(", ")}` : "No team members added.",
    ],
    { url: `${siteUrl()}/admin/clients/${orgId.toString()}`, label: "Review client" },
  );
  await sendOnboardingConfirmation(invite.email, name);

  await startSession(user._id);
  redirect("/portal?welcome=1");
}

/* ------------------------------------------------ colleague accepts invite */

export async function acceptTeamInvite(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const token = str(formData.get("token"), 100);
  const found = await findInviteByToken(token);
  if (!found || found.invite.type !== "team" || !found.invite.orgId) return fail("This invite link isn't valid.");
  if (found.status !== "pending") return fail("This invite link has expired or was already used. Reload the page for options.");
  const name = str(formData.get("name"), 120);
  if (!name) return fail("Please enter your name.");
  if (formData.get("consent") !== "on") return fail("Please accept the terms and privacy policy to continue.");

  const c = await collections();
  const invite = found.invite;
  const org = await c.orgs.findOne({ _id: invite.orgId });
  if (!org || org.status === "archived") return fail("This organisation's portal access is closed.");

  const claimed = await c.invites.findOneAndUpdate(
    { _id: invite._id, status: "pending", tokenHash: invite.tokenHash, expiresAt: { $gt: new Date() } },
    { $set: { status: "accepted", acceptedAt: new Date() } },
  );
  if (!claimed) return fail("This invite link was already used. Try signing in instead.");

  const user = await upsertUser(invite.email, name);
  await c.memberships.updateOne(
    { orgId: org._id, userId: user._id },
    { $setOnInsert: { orgId: org._id, userId: user._id, role: invite.role ?? "member", createdAt: new Date() } },
    { upsert: true },
  );
  await audit({ orgId: org._id, actor: { userId: user._id, name, staff: false }, action: "invite.team.accepted", detail: invite.email });
  await notifyStaff(`${name} joined ${org.name}`, [`${name} (${invite.email}) accepted their invite to ${org.name} as ${roleLabel[invite.role ?? "member"]}.`], {
    url: `${siteUrl()}/admin/clients/${org._id.toString()}`,
    label: "View client",
  });

  await startSession(user._id);
  redirect("/portal");
}

/* ------------------------------------------- expired link: ask for a new one */

export async function requestNewLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const found = await findInviteByToken(str(formData.get("token"), 100));
  if (!found) return fail("This invite link isn't valid.");
  const { invite, status } = found;
  if (status === "accepted" || status === "revoked") return fail("This invite can't be renewed. Contact info@theparse.co.za for help.");
  if (status === "pending") return ok("This link is still valid. Reload the page to continue.");

  const recent = invite.rerequestedAt && Date.now() - invite.rerequestedAt.getTime() < REREQUEST_COOLDOWN_MINUTES * 60 * 1000;
  if (!recent) {
    const c = await collections();
    await c.invites.updateOne({ _id: invite._id }, { $set: { status: "rerequested", rerequestedAt: new Date() } });
    await audit({ orgId: invite.orgId, actor: { name: invite.email }, action: "invite.rerequested", detail: invite.email });
    await notifyStaff(
      `${invite.prefill?.company || invite.email} asked for a new invite link`,
      [`${invite.email} opened an expired invite link and asked for a new one.`],
      { url: `${siteUrl()}/admin/invites?status=rerequested`, label: "Send a new link" },
    );
  }
  return ok("Thanks. We've let theParse know, and they'll email you a new link shortly.");
}
