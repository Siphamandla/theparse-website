"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/portal/format";
import { addDocument } from "../../../actions";

type Item = { id: string; name: string; size: number; status: "uploading" | "done" | "error"; message?: string };

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg";
const MAX_BYTES = 25 * 1024 * 1024;

/** Drop or pick files; each goes straight to storage, then gets recorded against the client. */
export default function DocumentUploader({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [shared, setShared] = useState(true);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function upload(file: File) {
    const id = crypto.randomUUID();
    setItems((xs) => [{ id, name: file.name, size: file.size, status: "uploading" }, ...xs]);
    if (file.size > MAX_BYTES) return patch(id, { status: "error", message: "Larger than 25 MB" });
    try {
      const res = await fetch("/api/portal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, name: file.name, type: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) return patch(id, { status: "error", message: data.error ?? "Upload refused" });
      const put = await fetch(data.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) return patch(id, { status: "error", message: "Upload failed" });

      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("key", data.key);
      fd.set("name", file.name);
      fd.set("shared", shared ? "1" : "0");
      const saved = await addDocument(fd);
      patch(id, saved?.ok ? { status: "done" } : { status: "error", message: saved?.message ?? "Couldn't save" });
    } catch {
      patch(id, { status: "error", message: "Network error" });
    }
  }

  const pick = (list: FileList | null) => {
    if (list) Array.from(list).forEach(upload);
    if (input.current) input.current.value = "";
  };

  if (!enabled) {
    return (
      <div className="pt-empty">
        File storage isn&apos;t configured yet. Add the R2 settings (see docs/client-portal.md) to attach documents.
      </div>
    );
  }

  return (
    <div className="pt-stack" style={{ gap: 12 }}>
      <label
        className={`pt-drop ${over ? "over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files);
        }}
      >
        <input ref={input} type="file" multiple accept={ACCEPT} className="pt-sr" onChange={(e) => pick(e.target.files)} />
        <b>Drop files here or <span className="pt-link">browse</span></b>
        <span>PDF, Word, Excel, PowerPoint, PNG or JPG · up to 25 MB each</span>
      </label>

      <label className="pt-check">
        <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
        <span>
          Share with the client
          <small>They&apos;ll see these files in their portal. Untick to keep them internal.</small>
        </span>
      </label>

      {items.length ? (
        <ul className="pt-list" style={{ gap: 8 }} aria-live="polite">
          {items.map((f) => (
            <li key={f.id} className="pt-file">
              <span className="pt-file-name">{f.name}</span>
              <span className="pt-muted" style={{ fontSize: 12 }}>
                {f.status === "uploading" ? "Uploading…" : f.status === "done" ? `${formatBytes(f.size)} · added` : null}
                {f.status === "error" ? <span style={{ color: "var(--pt-bad)" }}>{f.message}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
