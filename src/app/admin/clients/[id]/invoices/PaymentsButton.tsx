"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import { formatDate, formatMoney, formatTimestamp, paymentMethodLabel } from "@/lib/portal/format";
import { deletePayment, recordPayment } from "../../../actions";

export type PaymentRow = { id: string; amountCents: number; paidAt: string; method: keyof typeof paymentMethodLabel; reference?: string; recordedBy: string; recordedAt: string };

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

function Submit({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? "…" : children}</button>;
}

function RemovePayment({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) {
  const [state, action] = useFormState(deletePayment, null);
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm("Remove this payment?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={invoiceId} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <Submit className="pt-dt-btn quiet">Remove</Submit>
      {state && !state.ok ? <span className="pt-dt-sub" style={{ color: "var(--pt-bad)" }}>{state.message}</span> : null}
    </form>
  );
}

/** Opens a dialog with an invoice's payments and a form to record a new one. */
export default function PaymentsButton(props: {
  invoiceId: string;
  number: string;
  amountCents: number;
  balanceCents: number;
  payments: PaymentRow[];
  canRecord: boolean;
  blockedReason?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState(async (prev: Awaited<ReturnType<typeof recordPayment>>, fd: FormData) => {
    const res = await recordPayment(prev, fd);
    if (res?.ok) form.current?.reset();
    return res;
  }, null);
  const paid = props.amountCents - props.balanceCents;
  const label = props.balanceCents > 0 && props.canRecord ? "Record payment" : `Payments (${props.payments.length})`;

  return (
    <>
      <button type="button" className={props.balanceCents > 0 && props.canRecord ? "pt-dt-btn" : "pt-dt-btn quiet-neutral"} onClick={() => dialog.current?.showModal()}>
        {label}
      </button>
      <dialog ref={dialog} className="pt-modal" aria-label={`Payments for invoice ${props.number}`} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <div className="pt-preview-bar">
          <b>Invoice {props.number}</b>
          <button type="button" className="pt-preview-x" aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="pt-modal-body">
          <div className="pt-paysum">
            <div><span>Invoice total</span><b>{formatMoney(props.amountCents)}</b></div>
            <div><span>Paid</span><b>{formatMoney(paid)}</b></div>
            <div><span>Balance</span><b style={{ color: props.balanceCents ? "var(--pt-warn)" : "var(--pt-ok)" }}>{formatMoney(props.balanceCents)}</b></div>
          </div>

          {props.payments.length ? (
            <table className="pt-dt-table pt-paylist">
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th><span className="pt-sr">Actions</span></th></tr></thead>
              <tbody>
                {props.payments.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Date">{formatDate(p.paidAt)}</td>
                    <td data-label="Amount" style={{ fontWeight: 600 }}>{formatMoney(p.amountCents)}</td>
                    <td className="pt-dt-muted" data-label="Method">{paymentMethodLabel[p.method]}</td>
                    <td className="pt-dt-muted" data-label="Reference">{p.reference || "—"}<div className="pt-dt-sub">Recorded by {p.recordedBy} · {formatTimestamp(p.recordedAt)}</div></td>
                    <td><RemovePayment invoiceId={props.invoiceId} paymentId={p.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="pt-muted" style={{ fontSize: 14 }}>No payments recorded yet.</p>
          )}

          {props.balanceCents > 0 ? (
            props.canRecord ? (
              <form ref={form} action={action} className="pt-form pt-payform">
                <h3 className="pt-h2" style={{ fontSize: 15 }}>Record a payment</h3>
                <input type="hidden" name="id" value={props.invoiceId} />
                <div className="pt-fields">
                  <div>
                    <label className="pt-label" htmlFor={`pa-${props.invoiceId}`}>Amount received *</label>
                    <input className="pt-input" id={`pa-${props.invoiceId}`} name="amount" required inputMode="decimal" defaultValue={(props.balanceCents / 100).toFixed(2)} />
                  </div>
                  <div>
                    <label className="pt-label" htmlFor={`pd-${props.invoiceId}`}>Date received *</label>
                    <input className="pt-input" id={`pd-${props.invoiceId}`} name="paidAt" type="date" required defaultValue={iso(new Date())} max={iso(new Date())} />
                  </div>
                  <div>
                    <label className="pt-label" htmlFor={`pm-${props.invoiceId}`}>Method</label>
                    <select className="pt-input" id={`pm-${props.invoiceId}`} name="method" defaultValue="eft">
                      {Object.entries(paymentMethodLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="pt-label" htmlFor={`pr-${props.invoiceId}`}>Reference</label>
                    <input className="pt-input" id={`pr-${props.invoiceId}`} name="reference" maxLength={80} placeholder="Bank ref / transaction ID" />
                  </div>
                </div>
                <FormMessage state={state} />
                <div><Submit className="pt-btn sm">Record payment</Submit></div>
              </form>
            ) : (
              <div className="pt-alert error">{props.blockedReason}</div>
            )
          ) : (
            <div className="pt-alert success">Paid in full.</div>
          )}
        </div>
      </dialog>
    </>
  );
}
