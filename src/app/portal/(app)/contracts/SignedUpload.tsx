"use client";

import { useRef, useState } from "react";
import { ACCEPT_DOCS, uploadFile } from "@/components/portal/upload";
import { submitSignedContract } from "./actions";

/** "Upload signed copy" for one contract. */
export default function SignedUpload({ contractId, title }: { contractId: string; title: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const up = await uploadFile(file, { purpose: "signed-contract", contractId });
    if ("error" in up) {
      setBusy(false);
      setMsg({ ok: false, text: up.error });
      return;
    }
    const fd = new FormData();
    fd.set("contractId", contractId);
    fd.set("key", up.key);
    fd.set("name", file.name);
    const res = await submitSignedContract(fd);
    setBusy(false);
    setMsg({ ok: Boolean(res?.ok), text: res?.message ?? "" });
    if (input.current) input.current.value = "";
  }

  return (
    <span className="pt-signed-up">
      <input ref={input} type="file" accept={ACCEPT_DOCS} className="pt-sr" tabIndex={-1} aria-hidden="true" onChange={(e) => onPick(e.target.files?.[0])} />
      <button type="button" className="pt-paybtn" disabled={busy} onClick={() => input.current?.click()} aria-label={`Upload signed copy of ${title}`}>
        {busy ? "Uploading…" : "Upload signed copy"}
      </button>
      {msg ? <span role={msg.ok ? "status" : "alert"} style={{ color: msg.ok ? "var(--pt-ok)" : "var(--pt-bad)" }}>{msg.text}</span> : null}
    </span>
  );
}
