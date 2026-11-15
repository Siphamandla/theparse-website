"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import getMongoClient from "@/lib/mongodb";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import { adminEmails, INVITE_DAY_OPTIONS, INVITE_DAYS_DEFAULT } from "@/lib/portal/config";
import { orgFolder, recordUpload } from "@/lib/portal/files";
import { collections, db, toObjectId, type OrgStatus, type ProjectStatus } from "@/lib/portal/db";
import { sendContractEmail, sendInvoiceEmail, sendProjectEmail } from "@/lib/portal/email";
import { siteUrl } from "@/lib/portal/config";
import { formatMoney, isEmail, isKnownService, normaliseEmail, normaliseRegNumber, parseAmountToCents, PROJECT_STATUSES, projectStatusLabel } from "@/lib/portal/format";
import { checkTeamEmails, createClientInvite, createTeamInvite, resendInvite, revokeInvite } from "@/lib/portal/invites";
import { requireStaff } from "@/lib/portal/session";
import { deleteObject, deleteObjects, listKeys, storageConfigured } from "@/lib/portal/storage";

/** Every admin action re-checks that the caller is theParse staff. */
async function staff() {
  const user = await requireStaff();
  return { user, actor: { userId: user._id, name: user.displayName, staff: true } };
}

/* ---------------------------------------------------------------- invites */

export async function sendClientInvite(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const email = normaliseEmail(formData.get("email"));
  if (!isEmail(email)) return fail("Enter a valid client email.");
  const regNumber = normaliseRegNumber(formData.get("regNumber"));
  if (regNumber === null) return fail("Enter a valid registration number, e.g. 2019/123456/07.");

  const c = await collections();
  const existing = await c.users.findOne({ email });
  if (existing && (await c.memberships.findOne({ userId: existing._id }))) {
    return fail(`${email} already has portal access. Add them to a client from the client's page instead.`);
  }

  const daysRaw = Number(formData.get("days"));
  const days = (INVITE_DAY_OPTIONS as readonly number[]).includes(daysRaw) ? daysRaw : INVITE_DAYS_DEFAULT;
  const leadId = toObjectId(formData.get("leadId")) ?? undefined;

  const { emailed } = await createClientInvite({
    email,
    name: String(formData.get("name") ?? "").trim().slice(0, 120) || undefined,
    company: String(formData.get("company") ?? "").trim().slice(0, 160) || undefined,
    regNumber: regNumber || undefined,
    services: formData.getAll("services").map(String).filter(isKnownService),
    note: String(formData.get("note") ?? "").trim().slice(0, 1000) || undefined,
    days,
    existingClient: formData.get("kind") === "existing",
    leadId,
    by: actor,
  });
  revalidatePath("/admin", "layout");
  return emailed
    ? ok(`Invite sent to ${email}. The link expires in ${days} days.`)
    : fail(`Invite created, but the email to ${email} failed to send. Check the Resend settings, then use "Resend".`);
}

export async function resendInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  if (!id) return fail("Not found");
  const res = await resendInvite(id, actor);
  revalidatePath("/admin", "layout");
  if (!res.ok) return fail(res.error);
  return res.emailed ? ok("Sent") : fail("Email failed");
}

export async function revokeInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  if (!id) return fail("Not found");
  await revokeInvite(id, actor);
  revalidatePath("/admin", "layout");
  return ok("Revoked");
}

/* ---------------------------------------------------------------- clients */

async function setOrgStatus(formData: FormData, status: OrgStatus, action: string) {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  if (!id) return fail("Not found");
  const c = await collections();
  await c.orgs.updateOne({ _id: id }, { $set: { status, ...(status === "active" ? { reviewedAt: new Date() } : {}) } });
  await audit({ orgId: id, actor, action });
  revalidatePath("/admin", "layout");
  return ok("Saved");
}

export async function markReviewed(_prev: ActionResult, formData: FormData) {
  return setOrgStatus(formData, "active", "org.reviewed");
}
export async function archiveOrg(_prev: ActionResult, formData: FormData) {
  return setOrgStatus(formData, "archived", "org.archived");
}
export async function restoreOrg(_prev: ActionResult, formData: FormData) {
  return setOrgStatus(formData, "active", "org.restored");
}

/**
 * Permanently deletes a client: the organisation and everything attached to it (team,
 * invites, onboarding request, notes, documents, contracts, invoices and their stored files).
 * People who belong only to this client also lose their portal account; anyone who is also
 * in another client, or is theParse staff, keeps theirs. The audit log is kept.
 *
 * The admin must type the company name; it is checked again here, not just in the browser.
 */
export async function deleteOrg(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  if (!id) return fail("Client not found.");
  const c = await collections();
  const org = await c.orgs.findOne({ _id: id });
  if (!org) return fail("This client has already been deleted.");
  if (String(formData.get("confirmName") ?? "").trim() !== org.name.trim()) {
    return fail(`Type ${org.name} exactly to confirm.`);
  }

  // Payment records are financial records: deleteInvoice refuses them too.
  const paidInvoices = await c.invoices.countDocuments({ orgId: id, "payments.0": { $exists: true } });
  if (paidInvoices) {
    return fail(
      `${paidInvoices} invoice${paidInvoices === 1 ? " has" : "s have"} payments recorded, and payment records must be kept. Archive this client instead.`,
    );
  }

  const [memberships, submissions, documents, contracts, invoices] = await Promise.all([
    c.memberships.find({ orgId: id }).toArray(),
    c.submissions.find({ orgId: id }).toArray(),
    c.documents.find({ orgId: id }).project<{ key: string }>({ key: 1 }).toArray(),
    c.contracts.find({ orgId: id }).project<{ fileKey?: string; signedFileKey?: string }>({ fileKey: 1, signedFileKey: 1 }).toArray(),
    c.invoices.find({ orgId: id }).project<{ fileKey?: string }>({ fileKey: 1 }).toArray(),
  ]);
  const inviteIds = submissions.map((s) => s.inviteId);

  // Accounts to remove: members of this client who aren't in any other client and aren't staff.
  const memberIds = memberships.map((m) => m.userId);
  const inOtherOrgs: ObjectId[] = await c.memberships.distinct("userId", { userId: { $in: memberIds }, orgId: { $ne: id } });
  const staffEmails = adminEmails();
  const removable = (await c.users.find({ _id: { $in: memberIds } }).toArray()).filter(
    (u) => !inOtherOrgs.some((o) => o.equals(u._id)) && u.role !== "admin" && !staffEmails.includes(u.email.toLowerCase()),
  );
  const removableIds = removable.map((u) => u._id);
  const removableEmails = removable.map((u) => u.email.toLowerCase());

  // 1. Stored files first. If this fails, the database is untouched and the delete can simply be retried.
  const keys = new Set<string>(
    [
      ...documents.map((d) => d.key),
      ...contracts.flatMap((k) => [k.fileKey, k.signedFileKey]),
      ...invoices.map((i) => i.fileKey),
      ...submissions.flatMap((s) => s.attachments.map((a) => a.key)),
    ].filter((k): k is string => Boolean(k)),
  );
  try {
    if (storageConfigured()) {
      // Also catches uploads that started but were never recorded.
      const prefixes = [orgFolder(id), ...inviteIds.map((i) => `onboarding/${i.toString()}/`)];
      for (const p of prefixes) for (const k of await listKeys(p)) keys.add(k);
      await deleteObjects(Array.from(keys));
    } else if (keys.size) {
      return fail("File storage isn't configured, so this client's files can't be deleted. Nothing was deleted.");
    }
  } catch (err) {
    console.error("❌ [Portal] Could not delete client files", err);
    return fail("Couldn't delete the client's files from storage. Nothing else was deleted. Try again.");
  }

  // 2. Database records, all or nothing.
  const d = await db();
  const session = (await getMongoClient()).startSession();
  try {
    await session.withTransaction(async () => {
      const o = { session };
      await c.orgs.deleteOne({ _id: id }, o);
      await c.memberships.deleteMany({ orgId: id }, o);
      await c.invites.deleteMany({ $or: [{ orgId: id }, { _id: { $in: inviteIds } }] }, o);
      await c.submissions.deleteMany({ orgId: id }, o);
      await c.notes.deleteMany({ orgId: id }, o);
      await c.documents.deleteMany({ orgId: id }, o);
      await c.contracts.deleteMany({ orgId: id }, o);
      await c.invoices.deleteMany({ orgId: id }, o);
      await c.projects.deleteMany({ orgId: id }, o);
      if (removableIds.length) {
        await c.sessions.deleteMany({ userId: { $in: removableIds } }, o);
        await d.collection("accounts").deleteMany({ userId: { $in: removableIds } }, o);
        await d.collection("verification_tokens").deleteMany({ identifier: { $in: removableEmails } }, o);
        await c.users.deleteMany({ _id: { $in: removableIds } }, o);
      }
    });
  } catch (err) {
    console.error("❌ [Portal] Could not delete client records", err);
    return fail("The files were deleted, but the client's records couldn't be. Try again.");
  } finally {
    await session.endSession();
  }

  await audit({
    orgId: id,
    actor,
    action: "org.deleted",
    detail: `${org.name} · ${removable.length} account${removable.length === 1 ? "" : "s"} and ${keys.size} file${keys.size === 1 ? "" : "s"} removed`,
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/clients?deleted=${encodeURIComponent(org.name)}`);
}

export async function addNote(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  const text = String(formData.get("text") ?? "").trim().slice(0, 4000);
  if (!orgId || !text) return fail("Write a note first.");
  const c = await collections();
  await c.notes.insertOne({ orgId, author: { userId: actor.userId, name: actor.name }, text, createdAt: new Date() } as never);
  revalidatePath(`/admin/clients/${orgId.toString()}`, "layout");
  return ok("Note added");
}

/** Sets or clears a client's company registration number. */
export async function setRegNumber(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  if (!orgId) return fail("Not found");
  const regNumber = normaliseRegNumber(formData.get("regNumber"));
  if (regNumber === null) return fail("Use letters, numbers, spaces, / . or -, e.g. 2019/123456/07.");
  const c = await collections();
  await c.orgs.updateOne({ _id: orgId }, regNumber ? { $set: { regNumber } } : { $unset: { regNumber: "" } });
  await audit({ orgId, actor, action: "client.regnumber", detail: regNumber || "cleared" });
  revalidatePath(`/admin/clients/${orgId.toString()}`, "layout");
  revalidatePath("/admin/clients");
  return ok(regNumber ? "Saved" : "Cleared");
}

export async function staffInviteMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  const c = await collections();
  const org = orgId ? await c.orgs.findOne({ _id: orgId }) : null;
  if (!org) return fail("Client not found.");
  const email = normaliseEmail(formData.get("email"));
  if (!isEmail(email)) return fail("Enter a valid email address.");
  const error = await checkTeamEmails(org._id, [email]);
  if (error) return fail(error);
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const name = String(formData.get("name") ?? "").trim().slice(0, 120) || undefined;
  const { emailed } = await createTeamInvite({ orgId: org._id, orgName: org.name, email, name, role, by: actor });
  revalidatePath(`/admin/clients/${org._id.toString()}`, "layout");
  return emailed ? ok(`Invite sent to ${email}.`) : fail(`Invite created, but the email failed. Try "Resend".`);
}

export async function staffChangeRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const c = await collections();
  const m = id ? await c.memberships.findOne({ _id: id }) : null;
  if (!m || m.role === "owner") return fail("Can't change this role.");
  await c.memberships.updateOne({ _id: m._id }, { $set: { role } });
  await audit({ orgId: m.orgId, actor, action: "member.role_changed", detail: role });
  revalidatePath(`/admin/clients/${m.orgId.toString()}`, "layout");
  return ok("Saved");
}

export async function staffRemoveMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const m = id ? await c.memberships.findOne({ _id: id }) : null;
  if (!m) return fail("Not found");
  if (m.role === "owner") return fail("The owner can't be removed.");
  const u = await c.users.findOne({ _id: m.userId });
  await c.memberships.deleteOne({ _id: m._id });
  await c.sessions.deleteMany({ userId: m.userId });
  await audit({ orgId: m.orgId, actor, action: "member.removed", detail: u?.email });
  revalidatePath(`/admin/clients/${m.orgId.toString()}`, "layout");
  return ok("Removed");
}

/* ------------------------------------------------------------------ leads */

export async function archiveLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  if (!id) return fail("Not found");
  const c = await collections();
  await c.leads.updateOne({ _id: id }, { $set: { status: "archived" } });
  await audit({ actor, action: "lead.archived", detail: id.toString() });
  revalidatePath("/admin", "layout");
  return ok("Archived");
}

/* -------------------------------------------------------------- documents */

const docPaths = (orgId: string) => {
  revalidatePath(`/admin/clients/${orgId}`, "layout");
  revalidatePath("/portal", "layout");
};

/** Records a general document the browser has just uploaded (see /api/portal/documents). */
export async function addDocument(formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  if (!orgId) return fail("Client not found.");
  const shared = formData.get("shared") === "1";
  let project: { _id: ObjectId; name: string } | null = null;
  if (formData.get("projectId")) {
    const projectId = toObjectId(formData.get("projectId"));
    project = projectId ? await (await collections()).projects.findOne({ _id: projectId, orgId }, { projection: { name: 1 } }) : null;
    if (!project) return fail("Project not found.");
  }
  const res = await recordUpload({
    orgId,
    key: String(formData.get("key") ?? ""),
    name: String(formData.get("name") ?? ""),
    projectId: project?._id,
    sharedWithClient: shared,
    by: actor,
  });
  if ("error" in res) return fail(res.error);
  await audit({
    orgId,
    actor,
    action: "document.added",
    detail: `${res.doc.name}${project ? ` · project ${project.name}` : ""}${shared ? " (shared with client)" : ""}`,
  });
  docPaths(orgId.toString());
  return ok(`${res.doc.name} added`);
}

export async function toggleDocumentSharing(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const doc = id ? await c.documents.findOne({ _id: id }) : null;
  if (!doc) return fail("Document not found.");
  const shared = !doc.sharedWithClient;
  await c.documents.updateOne({ _id: doc._id }, { $set: { sharedWithClient: shared } });
  await audit({ orgId: doc.orgId, actor, action: shared ? "document.shared" : "document.unshared", detail: doc.name });
  docPaths(doc.orgId.toString());
  return ok(shared ? "Shared with client" : "Now internal only");
}

export async function deleteDocument(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const doc = id ? await c.documents.findOne({ _id: id }) : null;
  if (!doc) return fail("Document not found.");
  try {
    await deleteObject(doc.key);
  } catch (err) {
    console.error("❌ [Portal] Could not delete stored file", err);
    return fail("Couldn't delete the file from storage. Try again.");
  }
  await c.documents.deleteOne({ _id: doc._id });
  await audit({ orgId: doc.orgId, actor, action: "document.deleted", detail: doc.name });
  docPaths(doc.orgId.toString());
  return ok("Deleted");
}

/* --------------------------------------------------------------- projects */

/** Reads and checks the editable project fields shared by create and update. */
function projectFields(formData: FormData): { error: string } | {
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: Date;
  dueDate?: Date;
} {
  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  if (!name) return { error: "Give the project a name." };
  const description = String(formData.get("description") ?? "").trim().slice(0, 4000) || undefined;
  const rawStatus = String(formData.get("status") ?? "planning");
  if (!(PROJECT_STATUSES as readonly string[]).includes(rawStatus)) return { error: "Pick a status." };
  const startDate = dateInput(formData.get("startDate")) ?? undefined;
  const dueDate = dateInput(formData.get("dueDate")) ?? undefined;
  if (formData.get("startDate") && !startDate) return { error: "The start date isn't valid." };
  if (formData.get("dueDate") && !dueDate) return { error: "The due date isn't valid." };
  if (startDate && dueDate && dueDate < startDate) return { error: "The due date can't be before the start date." };
  return { name, description, status: rawStatus as ProjectStatus, startDate, dueDate };
}

export async function createProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  const c = await collections();
  const org = orgId ? await c.orgs.findOne({ _id: orgId }) : null;
  if (!org) return fail("Client not found.");
  const f = projectFields(formData);
  if ("error" in f) return fail(f.error);

  const now = new Date();
  const { insertedId } = await c.projects.insertOne({ orgId: org._id, ...f, createdBy: actor, createdAt: now, updatedAt: now } as never);
  await audit({ orgId: org._id, actor, action: "project.created", detail: f.name });

  let emailed = "";
  if (formData.get("notify") === "1") {
    const ms = await c.memberships.find({ orgId: org._id }).project<{ userId: ObjectId }>({ userId: 1 }).toArray();
    const to = (await c.users.find({ _id: { $in: ms.map((m) => m.userId) } }).project<{ email: string }>({ email: 1 }).toArray())
      .map((u) => u.email)
      .filter(Boolean);
    try {
      const r = await sendProjectEmail({ to, orgName: org.name, name: f.name, description: f.description, url: `${siteUrl()}/portal/projects/${insertedId.toString()}` });
      emailed = r.failed ? `, but ${r.failed} of ${to.length} emails failed to send` : r.sent ? ` and emailed to ${r.sent} ${r.sent === 1 ? "person" : "people"}` : "";
    } catch (err) {
      console.error("❌ [Portal] Project email failed", err);
      emailed = ", but the email failed to send";
    }
  }
  docPaths(org._id.toString());
  redirect(`/admin/clients/${org._id.toString()}/projects/${insertedId.toString()}?created=${encodeURIComponent(`Project created${emailed}.`)}`);
}

export async function updateProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const project = id ? await c.projects.findOne({ _id: id }) : null;
  if (!project) return fail("Project not found.");
  const f = projectFields(formData);
  if ("error" in f) return fail(f.error);

  // Cleared optional fields are removed rather than stored as empty values.
  const optional = ["description", "startDate", "dueDate"] as const;
  const unset = Object.fromEntries(optional.filter((k) => f[k] === undefined).map((k) => [k, 1 as const]));
  const set = Object.fromEntries(Object.entries({ ...f, updatedAt: new Date() }).filter(([, v]) => v !== undefined));
  await c.projects.updateOne({ _id: project._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
  await audit({
    orgId: project.orgId,
    actor,
    action: "project.updated",
    detail: f.status !== project.status ? `${f.name} · ${projectStatusLabel[project.status]} → ${projectStatusLabel[f.status]}` : f.name,
  });
  docPaths(project.orgId.toString());
  return ok("Saved");
}

/** Deletes a project and the documents attached to it (records and stored files). */
export async function deleteProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  const project = id ? await c.projects.findOne({ _id: id }) : null;
  if (!project) return fail("This project has already been deleted.");
  const contracts = await c.contracts.countDocuments({ projectId: project._id });
  if (contracts) {
    return fail(`This project has ${contracts} contract${contracts === 1 ? "" : "s"}. Delete ${contracts === 1 ? "it" : "them"} first, or set the project to Cancelled instead.`);
  }

  const docs = await c.documents.find({ projectId: project._id }).project<{ key: string }>({ key: 1 }).toArray();
  if (docs.length) {
    if (!storageConfigured()) return fail("File storage isn't configured, so this project's files can't be deleted. Nothing was deleted.");
    try {
      await deleteObjects(docs.map((d) => d.key));
    } catch (err) {
      console.error("❌ [Portal] Could not delete project files", err);
      return fail("Couldn't delete the project's files from storage. Nothing was deleted. Try again.");
    }
    await c.documents.deleteMany({ projectId: project._id });
  }
  await c.projects.deleteOne({ _id: project._id });
  await audit({ orgId: project.orgId, actor, action: "project.deleted", detail: `${project.name} · ${docs.length} file${docs.length === 1 ? "" : "s"} removed` });
  docPaths(project.orgId.toString());
  redirect(`/admin/clients/${project.orgId.toString()}/projects`);
}

/* -------------------------------------------------- contracts & invoices */

/** Email addresses of a client's owners and admins (the people who sign and pay). */
async function decisionMakers(orgId: import("mongodb").ObjectId) {
  const c = await collections();
  const ms = await c.memberships.find({ orgId, role: { $in: ["owner", "admin"] } }).toArray();
  const users = await c.users.find({ _id: { $in: ms.map((m) => m.userId) } }).project<{ email: string }>({ email: 1 }).toArray();
  return users.map((u) => u.email).filter(Boolean);
}

const billingPaths = (orgId: string) => {
  revalidatePath(`/admin/clients/${orgId}`, "layout");
  revalidatePath("/portal", "layout");
};

/** Called right after the browser uploads the contract file (purpose "contract"). */
export async function createContract(formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  const projectId = toObjectId(formData.get("projectId"));
  const c = await collections();
  const org = orgId ? await c.orgs.findOne({ _id: orgId }) : null;
  if (!org) return fail("Client not found.");
  if (!projectId) return fail("Choose the project this contract is for.");
  // The project decides the client: it must belong to the client this form was opened for.
  const project = await c.projects.findOne({ _id: projectId, orgId: org._id });
  if (!project) return fail("That project doesn't belong to this client.");
  if (project.status === "completed" || project.status === "cancelled") {
    return fail(`${project.name} is ${projectStatusLabel[project.status].toLowerCase()}. Reopen it to send a new contract.`);
  }
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!title) return fail("Give the contract a title.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || undefined;

  const res = await recordUpload({
    orgId: org._id,
    key: String(formData.get("key") ?? ""),
    name: String(formData.get("name") ?? ""),
    category: "contract",
    sharedWithClient: true,
    by: actor,
  });
  if ("error" in res) return fail(res.error);

  await c.contracts.insertOne({
    orgId: org._id,
    projectId: project._id,
    title,
    note,
    status: "awaiting_signature",
    fileKey: res.doc.key,
    fileName: res.doc.name,
    sentAt: new Date(),
    createdBy: actor,
  } as never);
  await audit({ orgId: org._id, actor, action: "contract.sent", detail: `${title} · project ${project.name}` });

  let emailed = "";
  if (formData.get("notify") === "1") {
    const to = await decisionMakers(org._id);
    try {
      await sendContractEmail({ to, orgName: org.name, projectName: project.name, title, note, url: `${siteUrl()}/portal/contracts` });
      emailed = to.length ? ` and emailed to ${to.length} ${to.length === 1 ? "person" : "people"}` : "";
    } catch (err) {
      console.error("❌ [Portal] Contract email failed", err);
      emailed = ", but the email failed to send";
    }
  }
  billingPaths(org._id.toString());
  return ok(`Contract added${emailed}.`);
}

/** Links a contract sent before projects existed to one of the same client's projects. */
export async function linkContractToProject(formData: FormData): Promise<void> {
  const { actor } = await staff();
  const c = await collections();
  const contract = await c.contracts.findOne({ _id: toObjectId(formData.get("id")) ?? undefined });
  const projectId = toObjectId(formData.get("projectId"));
  if (!contract || contract.projectId || !projectId) return;
  const project = await c.projects.findOne({ _id: projectId, orgId: contract.orgId });
  if (!project) return;
  await c.contracts.updateOne({ _id: contract._id, projectId: { $exists: false } }, { $set: { projectId: project._id } });
  // Invoices billed under this contract belong to the same project.
  await c.invoices.updateMany({ contractId: contract._id }, { $set: { projectId: project._id } });
  await audit({ orgId: contract.orgId, actor, action: "contract.linked", detail: `${contract.title} → project ${project.name}` });
  billingPaths(contract.orgId.toString());
}

async function contractFor(formData: FormData) {
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  return { c, contract: id ? await c.contracts.findOne({ _id: id }) : null };
}

export async function reopenContract(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, contract } = await contractFor(formData);
  if (!contract) return fail("Contract not found.");
  if (await c.invoices.findOne({ contractId: contract._id, status: { $ne: "void" } })) {
    return fail("This contract has invoices against it. Cancel those first.");
  }
  await c.contracts.updateOne({ _id: contract._id }, { $set: { status: "awaiting_signature" }, $unset: { signedAt: "", signedBy: "", acceptance: "", signedFileKey: "", signedFileName: "" } });
  await c.documents.updateOne({ key: contract.fileKey }, { $set: { sharedWithClient: true } });
  await audit({ orgId: contract.orgId, actor, action: "contract.reopened", detail: contract.title });
  billingPaths(contract.orgId.toString());
  return ok("Awaiting signature again");
}

export async function voidContract(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, contract } = await contractFor(formData);
  if (!contract) return fail("Contract not found.");
  if (await c.invoices.findOne({ contractId: contract._id, status: { $ne: "void" } })) {
    return fail("This contract has invoices against it. Cancel those first.");
  }
  await c.contracts.updateOne({ _id: contract._id }, { $set: { status: "void" } });
  // Cancelled contracts disappear from the client's portal, files included.
  await c.documents.updateMany({ key: { $in: [contract.fileKey, contract.signedFileKey].filter(Boolean) as string[] } }, { $set: { sharedWithClient: false } });
  await audit({ orgId: contract.orgId, actor, action: "contract.cancelled", detail: contract.title });
  billingPaths(contract.orgId.toString());
  return ok("Cancelled");
}

export async function deleteContract(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, contract } = await contractFor(formData);
  if (!contract) return fail("Contract not found.");
  if (await c.invoices.findOne({ contractId: contract._id, status: { $ne: "void" } })) {
    return fail("This contract has invoices against it. Cancel those first.");
  }
  const keys = [contract.fileKey, contract.signedFileKey].filter(Boolean) as string[];
  try {
    await Promise.all(keys.map((k) => deleteObject(k)));
  } catch (err) {
    console.error("❌ [Portal] Could not delete contract files", err);
    return fail("Couldn't delete the files from storage. Try again.");
  }
  await c.documents.deleteMany({ key: { $in: keys } });
  await c.contracts.deleteOne({ _id: contract._id });
  await audit({ orgId: contract.orgId, actor, action: "contract.deleted", detail: contract.title });
  billingPaths(contract.orgId.toString());
  return ok("Deleted");
}

const dateInput = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Adds an invoice. The PDF is optional; when present the browser has already uploaded it (purpose "invoice"). */
export async function createInvoice(formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const orgId = toObjectId(formData.get("orgId"));
  const c = await collections();
  const org = orgId ? await c.orgs.findOne({ _id: orgId }) : null;
  if (!org) return fail("Client not found.");

  // Billing only starts once the client has accepted a contract; every invoice is billed under one.
  const contract = await c.contracts.findOne({ _id: toObjectId(formData.get("contractId")) ?? undefined, orgId: org._id });
  if (!contract) return fail(`Choose the contract this invoice is for. ${org.name} must accept a contract before you can invoice them.`);
  if (contract.status !== "signed") return fail(`"${contract.title}" hasn't been accepted yet, so it can't be invoiced.`);
  // Invoices are per project: the project comes from the contract.
  if (!contract.projectId) return fail(`Link "${contract.title}" to a project (Contracts tab) before invoicing under it.`);
  const project = await c.projects.findOne({ _id: contract.projectId, orgId: org._id }, { projection: { name: 1 } });
  if (!project) return fail(`"${contract.title}" is linked to a project that no longer exists.`);
  const expectedProject = toObjectId(formData.get("projectId"));
  if (expectedProject && !expectedProject.equals(project._id)) return fail("That contract belongs to a different project.");

  const number = String(formData.get("number") ?? "").trim().slice(0, 40);
  if (!number) return fail("Enter the invoice number.");
  if (await c.invoices.findOne({ number })) return fail(`Invoice ${number} already exists.`);
  const amountCents = parseAmountToCents(formData.get("amount"));
  if (!amountCents) return fail("Enter the amount, e.g. 12500.00");
  const issuedAt = dateInput(formData.get("issuedAt"));
  const dueAt = dateInput(formData.get("dueAt"));
  if (!issuedAt || !dueAt) return fail("Enter the issue and due dates.");
  if (dueAt < issuedAt) return fail("The due date can't be before the issue date.");

  const payUrlRaw = String(formData.get("payUrl") ?? "").trim();
  let payUrl: string | undefined;
  if (payUrlRaw) {
    try {
      const u = new URL(payUrlRaw);
      if (u.protocol !== "https:") throw new Error("not https");
      payUrl = u.toString();
    } catch {
      return fail("The payment link must be a full https:// address.");
    }
  }

  let file: { key: string; name: string } | undefined;
  const key = String(formData.get("key") ?? "");
  if (key) {
    const res = await recordUpload({ orgId: org._id, key, name: String(formData.get("name") ?? ""), category: "invoice", sharedWithClient: true, by: actor });
    if ("error" in res) return fail(res.error);
    file = { key: res.doc.key, name: res.doc.name };
  }

  await c.invoices.insertOne({
    orgId: org._id,
    number,
    amountCents,
    currency: "ZAR",
    issuedAt,
    dueAt,
    status: "unpaid",
    fileKey: file?.key,
    fileName: file?.name,
    payUrl,
    payments: [],
    contractId: contract._id,
    projectId: project._id,
    createdBy: actor,
    createdAt: new Date(),
  } as never);
  const amount = formatMoney(amountCents);
  await audit({ orgId: org._id, actor, action: "invoice.added", detail: `${number} · ${amount} · project ${project.name}` });

  let emailed = "";
  if (formData.get("notify") === "1") {
    const to = await decisionMakers(org._id);
    try {
      await sendInvoiceEmail({ to, orgName: org.name, projectName: project.name, number, amount, dueAt, url: `${siteUrl()}/portal/invoices` });
      emailed = to.length ? ` and emailed to ${to.length} ${to.length === 1 ? "person" : "people"}` : "";
    } catch (err) {
      console.error("❌ [Portal] Invoice email failed", err);
      emailed = ", but the email failed to send";
    }
  }
  billingPaths(org._id.toString());
  return ok(`Invoice ${number} added${emailed}.`);
}

async function invoiceFor(formData: FormData) {
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  return { c, invoice: id ? await c.invoices.findOne({ _id: id }) : null };
}

/** Re-derives paid/unpaid from the payments after any change. */
async function settleInvoice(id: import("mongodb").ObjectId) {
  const c = await collections();
  const inv = await c.invoices.findOne({ _id: id });
  if (!inv || inv.status === "void") return;
  const payments = inv.payments ?? [];
  const paid = payments.reduce((sum, p) => sum + p.amountCents, 0);
  if (paid >= inv.amountCents) {
    const last = payments.reduce((d, p) => (p.paidAt > d ? p.paidAt : d), payments[0]?.paidAt ?? new Date());
    await c.invoices.updateOne({ _id: id }, { $set: { status: "paid", paidAt: last } });
  } else {
    await c.invoices.updateOne({ _id: id }, { $set: { status: "unpaid" }, $unset: { paidAt: "" } });
  }
}

const METHODS = ["eft", "card", "cash", "other"] as const;

export async function recordPayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, invoice } = await invoiceFor(formData);
  if (!invoice) return fail("Invoice not found.");
  if (invoice.status === "void") return fail("This invoice is cancelled.");
  const contract = invoice.contractId ? await c.contracts.findOne({ _id: invoice.contractId }) : null;
  if (!contract || contract.status !== "signed") return fail("Payments can only be recorded once the client has accepted the contract.");

  const paid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amountCents, 0);
  const balance = invoice.amountCents - paid;
  if (balance <= 0) return fail("This invoice is already paid in full.");
  const amountCents = parseAmountToCents(formData.get("amount"));
  if (!amountCents) return fail("Enter the amount received, e.g. 5000.00");
  if (amountCents > balance) return fail(`That's more than the balance of ${formatMoney(balance)}.`);
  const paidAt = dateInput(formData.get("paidAt"));
  if (!paidAt) return fail("Enter the date the payment was received.");
  if (paidAt.getTime() > Date.now() + 86_400_000) return fail("The payment date can't be in the future.");
  const method = (METHODS as readonly string[]).includes(String(formData.get("method"))) ? (String(formData.get("method")) as (typeof METHODS)[number]) : "eft";
  const reference = String(formData.get("reference") ?? "").trim().slice(0, 80) || undefined;

  await c.invoices.updateOne(
    { _id: invoice._id },
    { $push: { payments: { id: crypto.randomUUID(), amountCents, paidAt, method, reference, recordedBy: actor, recordedAt: new Date() } } },
  );
  await settleInvoice(invoice._id);
  await audit({ orgId: invoice.orgId, actor, action: "invoice.payment_recorded", detail: `${invoice.number} · ${formatMoney(amountCents)}${reference ? ` · ${reference}` : ""}` });
  billingPaths(invoice.orgId.toString());
  const left = balance - amountCents;
  return ok(left ? `Payment recorded. ${formatMoney(left)} still owing.` : "Payment recorded. The invoice is now paid in full.");
}

export async function deletePayment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, invoice } = await invoiceFor(formData);
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = invoice?.payments?.find((p) => p.id === paymentId);
  if (!invoice || !payment) return fail("Payment not found.");
  await c.invoices.updateOne({ _id: invoice._id }, { $pull: { payments: { id: paymentId } } });
  await settleInvoice(invoice._id);
  await audit({ orgId: invoice.orgId, actor, action: "invoice.payment_deleted", detail: `${invoice.number} · ${formatMoney(payment.amountCents)}` });
  billingPaths(invoice.orgId.toString());
  return ok("Payment removed");
}

/** Brings a cancelled invoice back; its status is re-derived from its payments. */
export async function restoreInvoice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, invoice } = await invoiceFor(formData);
  if (!invoice) return fail("Invoice not found.");
  await c.invoices.updateOne({ _id: invoice._id }, { $set: { status: "unpaid" } });
  await settleInvoice(invoice._id);
  if (invoice.fileKey) await c.documents.updateOne({ key: invoice.fileKey }, { $set: { sharedWithClient: true } });
  await audit({ orgId: invoice.orgId, actor, action: "invoice.restored", detail: invoice.number });
  billingPaths(invoice.orgId.toString());
  return ok("Restored");
}

export async function voidInvoice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, invoice } = await invoiceFor(formData);
  if (!invoice) return fail("Invoice not found.");
  if (invoice.payments?.length) return fail("This invoice has payments recorded. Remove them first.");
  await c.invoices.updateOne({ _id: invoice._id }, { $set: { status: "void" } });
  if (invoice.fileKey) await c.documents.updateOne({ key: invoice.fileKey }, { $set: { sharedWithClient: false } });
  await audit({ orgId: invoice.orgId, actor, action: "invoice.cancelled", detail: invoice.number });
  billingPaths(invoice.orgId.toString());
  return ok("Cancelled");
}

export async function deleteInvoice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, invoice } = await invoiceFor(formData);
  if (!invoice) return fail("Invoice not found.");
  if (invoice.payments?.length) return fail("This invoice has payments recorded. Remove them first.");
  if (invoice.fileKey) {
    try {
      await deleteObject(invoice.fileKey);
    } catch (err) {
      console.error("❌ [Portal] Could not delete invoice file", err);
      return fail("Couldn't delete the file from storage. Try again.");
    }
    await c.documents.deleteOne({ key: invoice.fileKey });
  }
  await c.invoices.deleteOne({ _id: invoice._id });
  await audit({ orgId: invoice.orgId, actor, action: "invoice.deleted", detail: invoice.number });
  billingPaths(invoice.orgId.toString());
  return ok("Deleted");
}
