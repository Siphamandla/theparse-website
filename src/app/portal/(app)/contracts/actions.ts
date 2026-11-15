"use server";

import type { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import { siteUrl } from "@/lib/portal/config";
import { collections, toObjectId } from "@/lib/portal/db";
import { notifyStaff, sendContractSignedEmail } from "@/lib/portal/email";
import { recordUpload } from "@/lib/portal/files";
import { requireMember } from "@/lib/portal/session";
import { sha256Object } from "@/lib/portal/storage";

/** File types accepted as a signed copy: a signed PDF, or a scan/photo of the signed pages. */
const SIGNED_COPY_TYPES = ["application/pdf", "image/png", "image/jpeg"];

/**
 * Signing a contract. All of these are required, every time:
 * - the signed copy, already uploaded by the browser (see /api/portal/documents, purpose "signed-contract")
 * - the box confirming they've read and agree to it
 * - their full name, typed as an electronic signature
 * Records who, when, from where, a SHA-256 of the exact contract file, and the signed copy as evidence.
 */
export async function acceptContract(_prev: { ok: boolean; message: string } | null, formData: FormData) {
  const { user, org } = await requireMember();
  const c = await collections();
  const contract = await c.contracts.findOne({ _id: toObjectId(formData.get("contractId")) ?? undefined, orgId: org._id });
  if (!contract) return fail("Contract not found.");
  if (contract.status !== "awaiting_signature") return fail("This contract isn't waiting for acceptance any more.");
  if (formData.get("agree") !== "on") return fail("Tick the box to confirm you've read and agree to the contract.");
  const typedName = String(formData.get("typedName") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  if (typedName.length < 3 || !/\s/.test(typedName)) return fail("Type your full name (first and last name).");
  const key = String(formData.get("key") ?? "");
  if (!key) return fail("Attach your signed copy of the contract.");

  const actor = { userId: user._id, name: user.displayName, staff: false };
  const signed = await recordUpload({
    orgId: org._id,
    key,
    name: String(formData.get("name") ?? ""),
    category: "contract",
    sharedWithClient: true,
    by: actor,
  });
  if ("error" in signed) return fail(signed.error);
  if (!SIGNED_COPY_TYPES.includes(signed.doc.type)) return fail("The signed copy must be a PDF, PNG or JPG.");

  let fileSha256: string | undefined;
  try {
    fileSha256 = await sha256Object(contract.fileKey);
  } catch (err) {
    console.error("❌ [Portal] Could not fingerprint contract file", err);
    return fail("We couldn't confirm the contract file just now. Please try again.");
  }

  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || undefined;
  const signedAt = new Date();
  const updated = await c.contracts.updateOne(
    { _id: contract._id, status: "awaiting_signature" },
    {
      $set: {
        status: "signed",
        signedAt,
        signedBy: actor,
        signedFileKey: signed.doc.key,
        signedFileName: signed.doc.name,
        acceptance: { typedName, email: user.email, ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300) || undefined, fileSha256 },
      },
    },
  );
  if (!updated.modifiedCount) return fail("Someone at your company has already signed this contract.");

  await audit({ orgId: org._id, actor, action: "contract.accepted", detail: `${contract.title} · signed as "${typedName}", signed copy ${signed.doc.name}` });
  try {
    await notifyStaff(
      `${org.name} signed "${contract.title}"`,
      [
        `${typedName} (${user.email}) signed "${contract.title}" for ${org.name} in the client portal and attached the signed copy (${signed.doc.name}).`,
        "You can now issue invoices against it.",
      ],
      { url: `${siteUrl()}/admin/clients/${org._id.toString()}/contracts`, label: "View contract" },
    );
  } catch (err) {
    console.error("❌ [Portal] Acceptance notification failed", err);
  }

  // Confirmation for the client: the signer, plus their company's owners and admins.
  try {
    const project = contract.projectId ? await c.projects.findOne({ _id: contract.projectId }, { projection: { name: 1 } }) : null;
    const ms = await c.memberships.find({ orgId: org._id, role: { $in: ["owner", "admin"] } }).project<{ userId: ObjectId }>({ userId: 1 }).toArray();
    const others = await c.users.find({ _id: { $in: ms.map((m) => m.userId) } }).project<{ email: string }>({ email: 1 }).toArray();
    const to = Array.from(new Set([user.email, ...others.map((u) => u.email)].filter(Boolean).map((e) => e.toLowerCase())));
    const r = await sendContractSignedEmail({
      to,
      orgName: org.name,
      title: contract.title,
      projectName: project?.name,
      typedName,
      signedAt,
      signedCopyName: signed.doc.name,
      url: project ? `${siteUrl()}/portal/projects/${project._id.toString()}` : `${siteUrl()}/portal/contracts`,
    });
    if (r.failed) console.error(`❌ [Portal] ${r.failed} of ${to.length} contract-signed confirmations failed`);
  } catch (err) {
    console.error("❌ [Portal] Contract-signed confirmation failed", err);
  }
  revalidatePath("/portal", "layout");
  revalidatePath(`/admin/clients/${org._id.toString()}`, "layout");
  return ok("Thank you. The contract is signed and your signed copy is saved. We've emailed you a confirmation.");
}
