"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import { INVITE_DAY_OPTIONS, INVITE_DAYS_DEFAULT } from "@/lib/portal/config";
import { recordUpload } from "@/lib/portal/files";
import { collections, toObjectId, type OrgStatus } from "@/lib/portal/db";
import { sendContractEmail, sendInvoiceEmail } from "@/lib/portal/email";
import { siteUrl } from "@/lib/portal/config";
import { formatMoney, isEmail, isKnownService, normaliseEmail, normaliseRegNumber, parseAmountToCents } from "@/lib/portal/format";
import { checkTeamEmails, createClientInvite, createTeamInvite, resendInvite, revokeInvite } from "@/lib/portal/invites";
import { requireStaff } from "@/lib/portal/session";
import { deleteObject } from "@/lib/portal/storage";

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
  const res = await recordUpload({
    orgId,
    key: String(formData.get("key") ?? ""),
    name: String(formData.get("name") ?? ""),
    sharedWithClient: shared,
    by: actor,
  });
  if ("error" in res) return fail(res.error);
  await audit({ orgId, actor, action: "document.added", detail: `${res.doc.name}${shared ? " (shared with client)" : ""}` });
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
  const c = await collections();
  const org = orgId ? await c.orgs.findOne({ _id: orgId }) : null;
  if (!org) return fail("Client not found.");
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
    title,
    note,
    status: "awaiting_signature",
    fileKey: res.doc.key,
    fileName: res.doc.name,
    sentAt: new Date(),
    createdBy: actor,
  } as never);
  await audit({ orgId: org._id, actor, action: "contract.sent", detail: title });

  let emailed = "";
  if (formData.get("notify") === "1") {
    const to = await decisionMakers(org._id);
    try {
      await sendContractEmail({ to, orgName: org.name, title, note, url: `${siteUrl()}/portal/contracts` });
      emailed = to.length ? ` and emailed to ${to.length} ${to.length === 1 ? "person" : "people"}` : "";
    } catch (err) {
      console.error("❌ [Portal] Contract email failed", err);
      emailed = ", but the email failed to send";
    }
  }
  billingPaths(org._id.toString());
  return ok(`Contract added${emailed}.`);
}

async function contractFor(formData: FormData) {
  const id = toObjectId(formData.get("id"));
  const c = await collections();
  return { c, contract: id ? await c.contracts.findOne({ _id: id }) : null };
}

export async function markContractSigned(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, contract } = await contractFor(formData);
  if (!contract) return fail("Contract not found.");
  await c.contracts.updateOne({ _id: contract._id }, { $set: { status: "signed", signedAt: new Date(), signedBy: actor } });
  await audit({ orgId: contract.orgId, actor, action: "contract.marked_accepted", detail: contract.title });
  billingPaths(contract.orgId.toString());
  return ok("Marked as accepted");
}

export async function reopenContract(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { actor } = await staff();
  const { c, contract } = await contractFor(formData);
  if (!contract) return fail("Contract not found.");
  if (await c.invoices.findOne({ contractId: contract._id, status: { $ne: "void" } })) {
    return fail("This contract has invoices against it. Cancel those first.");
  }
  await c.contracts.updateOne({ _id: contract._id }, { $set: { status: "awaiting_signature" }, $unset: { signedAt: "", signedBy: "", acceptance: "" } });
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
    createdBy: actor,
    createdAt: new Date(),
  } as never);
  const amount = formatMoney(amountCents);
  await audit({ orgId: org._id, actor, action: "invoice.added", detail: `${number} · ${amount}` });

  let emailed = "";
  if (formData.get("notify") === "1") {
    const to = await decisionMakers(org._id);
    try {
      await sendInvoiceEmail({ to, orgName: org.name, number, amount, dueAt, url: `${siteUrl()}/portal/invoices` });
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
