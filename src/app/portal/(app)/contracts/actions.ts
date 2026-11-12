"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { fail, ok, type ActionResult } from "@/lib/portal/action-result";
import { audit } from "@/lib/portal/audit";
import { siteUrl } from "@/lib/portal/config";
import { collections, toObjectId } from "@/lib/portal/db";
import { notifyStaff } from "@/lib/portal/email";
import { recordUpload } from "@/lib/portal/files";
import { requireMember } from "@/lib/portal/session";
import { sha256Object } from "@/lib/portal/storage";

/** A client uploaded their signed copy (see /api/portal/documents, purpose "signed-contract"). */
export async function submitSignedContract(formData: FormData): Promise<ActionResult> {
  const { user, org } = await requireMember();
  const c = await collections();
  const contract = await c.contracts.findOne({ _id: toObjectId(formData.get("contractId")) ?? undefined, orgId: org._id });
  if (!contract) return fail("Contract not found.");
  if (contract.status !== "awaiting_signature") return fail("This contract isn't waiting for a signature any more.");

  const actor = { userId: user._id, name: user.displayName, staff: false };
  const res = await recordUpload({
    orgId: org._id,
    key: String(formData.get("key") ?? ""),
    name: String(formData.get("name") ?? ""),
    category: "contract",
    sharedWithClient: true,
    by: actor,
  });
  if ("error" in res) return fail(res.error);

  // Only flip the status if it's still awaiting (guards against two people uploading at once).
  const updated = await c.contracts.updateOne(
    { _id: contract._id, status: "awaiting_signature" },
    { $set: { status: "signed", signedFileKey: res.doc.key, signedFileName: res.doc.name, signedAt: new Date(), signedBy: actor } },
  );
  if (!updated.modifiedCount) return fail("Someone already uploaded a signed copy.");

  await audit({ orgId: org._id, actor, action: "contract.signed_by_client", detail: contract.title });
  try {
    await notifyStaff(
      `${org.name} signed "${contract.title}"`,
      [`${user.displayName} uploaded a signed copy of "${contract.title}" for ${org.name}.`],
      { url: `${siteUrl()}/admin/clients/${org._id.toString()}/contracts`, label: "View contract" },
    );
  } catch (err) {
    console.error("❌ [Portal] Signed-contract notification failed", err);
  }
  revalidatePath("/portal", "layout");
  revalidatePath(`/admin/clients/${org._id.toString()}`, "layout");
  return ok("Thanks, we've received your signed copy. The contract is now accepted.");
}

/**
 * Click-to-accept: the client confirms they've read the contract and types their full name.
 * Records who, when, from where, and a SHA-256 of the exact file as evidence.
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

  let fileSha256: string | undefined;
  try {
    fileSha256 = await sha256Object(contract.fileKey);
  } catch (err) {
    console.error("❌ [Portal] Could not fingerprint contract file", err);
    return fail("We couldn't confirm the contract file just now. Please try again.");
  }

  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || undefined;
  const actor = { userId: user._id, name: user.displayName, staff: false };
  const updated = await c.contracts.updateOne(
    { _id: contract._id, status: "awaiting_signature" },
    {
      $set: {
        status: "signed",
        signedAt: new Date(),
        signedBy: actor,
        acceptance: { typedName, email: user.email, ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300) || undefined, fileSha256 },
      },
    },
  );
  if (!updated.modifiedCount) return fail("Someone at your company has already accepted this contract.");

  await audit({ orgId: org._id, actor, action: "contract.accepted", detail: `${contract.title} · accepted as "${typedName}"` });
  try {
    await notifyStaff(
      `${org.name} accepted "${contract.title}"`,
      [`${typedName} (${user.email}) accepted "${contract.title}" for ${org.name} in the client portal.`, "You can now issue invoices against it."],
      { url: `${siteUrl()}/admin/clients/${org._id.toString()}/contracts`, label: "View contract" },
    );
  } catch (err) {
    console.error("❌ [Portal] Acceptance notification failed", err);
  }
  revalidatePath("/portal", "layout");
  revalidatePath(`/admin/clients/${org._id.toString()}`, "layout");
  return ok("Thank you. The contract is accepted.");
}
