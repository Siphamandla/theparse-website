import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ALLOWED_ATTACHMENT_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/portal/config";
import { collections, toObjectId } from "@/lib/portal/db";
import { orgFolder } from "@/lib/portal/files";
import { currentUser } from "@/lib/portal/session";
import { presignUpload, storageConfigured } from "@/lib/portal/storage";

type Purpose = "document" | "contract" | "invoice" | "signed-contract";
const PURPOSES: Purpose[] = ["document", "contract", "invoice", "signed-contract"];

/**
 * A short-lived URL to upload one file straight to storage, into the client's folder.
 * - Staff: any purpose for any client.
 * - Client members: only `signed-contract`, for a contract of their own that's awaiting signature.
 * The matching server action then verifies and records the upload.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!storageConfigured()) {
    return NextResponse.json({ error: "File storage isn't configured yet." }, { status: 503 });
  }

  let body: { orgId?: string; name?: string; type?: string; size?: number; purpose?: string; contractId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const purpose = (PURPOSES as string[]).includes(String(body.purpose)) ? (body.purpose as Purpose) : "document";
  const c = await collections();

  let orgId = toObjectId(body.orgId);
  if (purpose === "signed-contract") {
    const contract = await c.contracts.findOne({ _id: toObjectId(body.contractId) ?? undefined });
    if (!contract || contract.status !== "awaiting_signature") {
      return NextResponse.json({ error: "This contract isn't waiting for a signature." }, { status: 400 });
    }
    if (!user.staff) {
      const member = await c.memberships.findOne({ orgId: contract.orgId, userId: user._id });
      if (!member) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    orgId = contract.orgId;
  } else if (!user.staff) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const org = orgId ? await c.orgs.findOne({ _id: orgId }, { projection: { _id: 1 } }) : null;
  if (!org) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const type = String(body.type ?? "");
  const size = Number(body.size ?? 0);
  if (!ALLOWED_ATTACHMENT_TYPES[type]) {
    return NextResponse.json({ error: "Unsupported file type. Use PDF, Word, Excel, PowerPoint, PNG or JPG." }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "Files can be up to 25 MB each." }, { status: 400 });
  }

  const category = purpose === "document" ? undefined : purpose === "invoice" ? "invoice" : "contract";
  const safeName = String(body.name ?? "file").replace(/[^\w.\- ]+/g, "_").slice(-100) || "file";
  const key = `${orgFolder(org._id, category)}${randomUUID()}-${safeName}`;
  return NextResponse.json({ url: await presignUpload(key, type, size), key });
}
