import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/portal/config";
import { findInviteByToken } from "@/lib/portal/invites";
import { presignUpload, storageConfigured } from "@/lib/portal/storage";

/**
 * Gives the onboarding form a short-lived URL to upload one attachment straight
 * to storage. Only valid, unused client invite links can upload, and only into
 * that invite's own folder. The submit step re-checks every file.
 */
export async function POST(request: Request) {
  if (!storageConfigured()) {
    return NextResponse.json({ error: "File uploads aren't available yet. You can send files to your theParse contact instead." }, { status: 503 });
  }
  let body: { token?: string; name?: string; type?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const found = await findInviteByToken(String(body.token ?? ""));
  if (!found || found.status !== "pending" || found.invite.type !== "client") {
    return NextResponse.json({ error: "This invite link is no longer valid." }, { status: 403 });
  }
  const type = String(body.type ?? "");
  const size = Number(body.size ?? 0);
  if (!ALLOWED_ATTACHMENT_TYPES[type]) {
    return NextResponse.json({ error: "That file type isn't supported. Use PDF, Word, Excel, PowerPoint, PNG or JPG." }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Files can be up to 10 MB each." }, { status: 400 });
  }

  const safeName = String(body.name ?? "file").replace(/[^\w.\- ]+/g, "_").slice(-100) || "file";
  const key = `onboarding/${found.invite._id.toString()}/${randomUUID()}-${safeName}`;
  const url = await presignUpload(key, type, size);
  return NextResponse.json({ url, key });
}
