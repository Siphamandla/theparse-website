"use client";

import { useRef, useState } from "react";
import FormMessage from "@/components/portal/FormMessage";
import { ACCEPT_DOCS, uploadFile } from "@/components/portal/upload";
import type { ActionResult } from "@/lib/portal/action-result";
import { createContract } from "../../../actions";

/** Upload a contract for the client to sign. */
export default function ContractForm({ orgId }: { orgId: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<ActionResult>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return setState({ ok: false, message: "Choose the contract file." });
    setBusy(true);
    setState(null);
    const up = await uploadFile(file, { purpose: "contract", orgId });
    if ("error" in up) {
      setBusy(false);
      return setState({ ok: false, message: up.error });
    }
    fd.delete("file");
    fd.set("orgId", orgId);
    fd.set("key", up.key);
    fd.set("name", file.name);
    const res = await createContract(fd);
    setBusy(false);
    setState(res);
    if (res?.ok) form.current?.reset();
  }

  return (
    <form ref={form} className="pt-form" onSubmit={onSubmit}>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="ct-title">Title *</label>
          <input className="pt-input" id="ct-title" name="title" required maxLength={160} placeholder="e.g. Fleet tracking: statement of work" />
        </div>
        <div>
          <label className="pt-label" htmlFor="ct-file">Contract file *</label>
          <input className="pt-input pt-input-file" id="ct-file" name="file" type="file" required accept={ACCEPT_DOCS} />
          <span className="pt-hint">PDF is best. Up to 25 MB.</span>
        </div>
      </div>
      <div>
        <label className="pt-label" htmlFor="ct-note">Note to the client <span className="pt-muted" style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea className="pt-input" id="ct-note" name="note" maxLength={1000} rows={3} placeholder="Anything they should know before signing" />
      </div>
      <label className="pt-check">
        <input type="checkbox" name="notify" value="1" defaultChecked />
        <span>
          Email the client&apos;s owners and admins
          <small>They&apos;ll get a link to review and sign it in the portal.</small>
        </span>
      </label>
      <FormMessage state={state} />
      <div>
        <button type="submit" className="pt-btn sm" disabled={busy}>{busy ? "Uploading…" : "Send contract"}</button>
      </div>
    </form>
  );
}
