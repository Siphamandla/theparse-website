"use client";

export const ACCEPT_DOCS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg";
export const MAX_DOC_BYTES = 25 * 1024 * 1024;

/**
 * Uploads one file straight to storage via /api/portal/documents and returns its key.
 * `fields` says what it's for (orgId + purpose, or contractId for a signed copy).
 */
export async function uploadFile(
  file: File,
  fields: { purpose: "document" | "contract" | "invoice" | "signed-contract"; orgId?: string; contractId?: string },
): Promise<{ key: string } | { error: string }> {
  if (file.size > MAX_DOC_BYTES) return { error: "Files can be up to 25 MB." };
  try {
    const res = await fetch("/api/portal/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, name: file.name, type: file.type, size: file.size }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error ?? "Upload refused." };
    const put = await fetch(data.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!put.ok) return { error: "Upload failed. Try again." };
    return { key: data.key };
  } catch {
    return { error: "Network error. Try again." };
  }
}
