import { NextResponse } from "next/server";
import { audit } from "@/lib/portal/audit";
import { collections } from "@/lib/portal/db";
import { currentUser } from "@/lib/portal/session";
import { previewType } from "@/lib/portal/preview";
import { presignDownload } from "@/lib/portal/storage";

/**
 * Downloads a stored file. Staff can download any file; clients only files that
 * belong to their organisation (and, for staff-added documents, only shared ones). Redirects to a 5-minute link.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const key = params.get("key") ?? "";
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const c = await collections();
  // Either an onboarding attachment or a document staff attached to the client.
  const submission = await c.submissions.findOne({ "attachments.key": key });
  const attachment = submission?.attachments.find((a) => a.key === key);
  const document = attachment ? null : await c.documents.findOne({ key });
  const file = attachment ?? document;
  const orgId = submission?.orgId ?? document?.orgId;
  if (!file || !orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.staff) {
    const member = await c.memberships.findOne({ orgId, userId: user._id });
    if (!member || (document && !document.sharedWithClient)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only PDFs and images are ever shown inline; anything else is always a download.
  const inline = params.get("inline") === "1" ? previewType(file.type, file.name) : null;

  await audit({
    orgId,
    actor: { userId: user._id, name: user.displayName, staff: user.staff },
    action: inline ? "file.viewed" : "file.downloaded",
    detail: file.name,
  });
  const res = NextResponse.redirect(await presignDownload(file.key, file.name, inline ?? undefined));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
