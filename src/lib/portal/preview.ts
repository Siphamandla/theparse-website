/** File types the browser can show safely inside the site. Shared by the server and the preview UI. */
export const PREVIEW_TYPES: Record<string, "pdf" | "image"> = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
};

const BY_EXT: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

/** The previewable MIME type for a file, from its stored type or (fallback) its extension; otherwise null. */
export function previewType(type: string | undefined, name: string): string | null {
  if (type && PREVIEW_TYPES[type]) return type;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXT[ext] ?? null;
}

export const fileUrl = (key: string, inline = false) =>
  `/api/portal/files?key=${encodeURIComponent(key)}${inline ? "&inline=1" : ""}`;
