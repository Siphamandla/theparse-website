"use client";

import { useRef, useState } from "react";
import FormMessage from "@/components/portal/FormMessage";
import { uploadFile } from "@/components/portal/upload";
import type { ActionResult } from "@/lib/portal/action-result";
import { createInvoice } from "../../../actions";

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

/** Record an invoice for the client, with an optional PDF and payment link. */
export default function InvoiceForm({ orgId, contracts }: { orgId: string; contracts: { id: string; title: string }[] }) {
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<ActionResult>(null);
  const today = new Date();
  const due = new Date(today.getTime() + 14 * 86_400_000);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    fd.delete("file");
    fd.set("orgId", orgId);
    setBusy(true);
    setState(null);
    if (file instanceof File && file.size) {
      const up = await uploadFile(file, { purpose: "invoice", orgId });
      if ("error" in up) {
        setBusy(false);
        return setState({ ok: false, message: up.error });
      }
      fd.set("key", up.key);
      fd.set("name", file.name);
    }
    const res = await createInvoice(fd);
    setBusy(false);
    setState(res);
    if (res?.ok) form.current?.reset();
  }

  return (
    <form ref={form} className="pt-form" onSubmit={onSubmit}>
      <div>
        <label className="pt-label" htmlFor="iv-contract">Contract *</label>
        <select className="pt-input" id="iv-contract" name="contractId" required defaultValue={contracts.length === 1 ? contracts[0].id : ""}>
          {contracts.length > 1 ? <option value="" disabled>Choose the accepted contract this invoice is for</option> : null}
          {contracts.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
        </select>
      </div>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="iv-number">Invoice number *</label>
          <input className="pt-input" id="iv-number" name="number" required maxLength={40} placeholder="INV-0042" />
        </div>
        <div>
          <label className="pt-label" htmlFor="iv-amount">Amount (ZAR, incl. VAT) *</label>
          <input className="pt-input" id="iv-amount" name="amount" required inputMode="decimal" placeholder="12 500.00" />
        </div>
        <div>
          <label className="pt-label" htmlFor="iv-issued">Issue date *</label>
          <input className="pt-input" id="iv-issued" name="issuedAt" type="date" required defaultValue={iso(today)} />
        </div>
        <div>
          <label className="pt-label" htmlFor="iv-due">Due date *</label>
          <input className="pt-input" id="iv-due" name="dueAt" type="date" required defaultValue={iso(due)} />
        </div>
      </div>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="iv-file">Invoice PDF</label>
          <input className="pt-input pt-input-file" id="iv-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" />
          <span className="pt-hint">The PDF from your accounting system.</span>
        </div>
        <div>
          <label className="pt-label" htmlFor="iv-pay">Payment link</label>
          <input className="pt-input" id="iv-pay" name="payUrl" type="url" placeholder="https://…" />
          <span className="pt-hint">Optional. Shows a “Pay now” button to the client.</span>
        </div>
      </div>
      <label className="pt-check">
        <input type="checkbox" name="notify" value="1" defaultChecked />
        <span>
          Email the client&apos;s owners and admins
          <small>They&apos;ll get the amount, due date and a link to the invoice.</small>
        </span>
      </label>
      <FormMessage state={state} />
      <div>
        <button type="submit" className="pt-btn sm" disabled={busy}>{busy ? "Saving…" : "Add invoice"}</button>
      </div>
    </form>
  );
}
