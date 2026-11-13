import type { Metadata } from "next";
import Link from "next/link";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import {
  balanceCents,
  formatDate,
  formatMoney,
  invoiceDisplayStatus,
  invoiceStatusLabel,
  invoiceTone,
  paidCents,
  formatTimestamp,
} from "@/lib/portal/format";
import { storageConfigured } from "@/lib/portal/storage";
import { deleteInvoice, restoreInvoice, voidInvoice } from "../../../actions";
import { getClient } from "../data";
import InvoiceForm from "./InvoiceForm";
import PaymentsButton from "./PaymentsButton";

export const metadata: Metadata = { title: "Client invoices" };

export default async function ClientInvoices({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const [invoices, contracts] = await Promise.all([
    c.invoices.find({ orgId: org._id }).sort({ issuedAt: -1, createdAt: -1 }).toArray(),
    c.contracts.find({ orgId: org._id }).sort({ sentAt: -1 }).toArray(),
  ]);
  const accepted = contracts.filter((k) => k.status === "signed");
  const awaiting = contracts.filter((k) => k.status === "awaiting_signature");
  const live = invoices.filter((i) => i.status !== "void");
  const owing = live.reduce((s, i) => s + balanceCents(i), 0);
  const overdue = live.filter((i) => invoiceDisplayStatus(i) === "overdue");
  const received = live.reduce((s, i) => s + paidCents(i), 0);
  const base = `/admin/clients/${org._id.toString()}`;

  return (
    <>
      <div className="pt-stats">
        <div className="pt-stat"><span>Outstanding</span><b>{formatMoney(owing)}</b><span>{live.filter((i) => balanceCents(i) > 0).length} with a balance</span></div>
        <div className="pt-stat"><span>Overdue</span><b style={overdue.length ? { color: "var(--pt-bad)" } : undefined}>{formatMoney(overdue.reduce((s, i) => s + balanceCents(i), 0))}</b><span>{overdue.length} invoice{overdue.length === 1 ? "" : "s"}</span></div>
        <div className="pt-stat"><span>Received</span><b>{formatMoney(received)}</b><span>All payments recorded</span></div>
      </div>

      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Add an invoice</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Invoices are billed under an accepted contract, so {org.name} can see and pay them in their portal.
          </p>
        </div>
        {accepted.length ? (
          <>
            <InvoiceForm orgId={org._id.toString()} contracts={accepted.map((k) => ({ id: k._id.toString(), title: k.title }))} />
            {!storageConfigured() ? <p className="pt-muted" style={{ fontSize: 13 }}>File storage isn&apos;t configured, so you can&apos;t attach PDFs yet.</p> : null}
          </>
        ) : (
          <div className="pt-gate">
            <b>Waiting for an accepted contract</b>
            <span>
              {awaiting.length
                ? `${org.name} hasn't accepted ${awaiting.length === 1 ? `"${awaiting[0].title}"` : "any of their contracts"} yet. Invoicing and payments open once they do.`
                : `Send ${org.name} a contract first. Invoicing and payments open once they accept it.`}
            </span>
            <Link className="pt-link" href={`${base}/contracts`}>Go to Contracts →</Link>
          </div>
        )}
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Invoices</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <div className="pt-dt-empty">No invoices yet.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Invoice</th><th>Amount</th><th>Balance</th><th>Due</th><th>Status</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const id = i._id.toString();
                  const s = invoiceDisplayStatus(i);
                  const contract = i.contractId ? contracts.find((k) => k._id.equals(i.contractId!)) : null;
                  const bal = balanceCents(i);
                  return (
                    <tr key={id}>
                      <td>
                        <div className="pt-dt-two">
                          <b>{i.number}</b>
                          {i.fileKey ? (
                            <FileLink className="pt-link pt-dt-file" fileKey={i.fileKey} name={i.fileName ?? `${i.number}.pdf`}>{i.fileName ?? "Invoice PDF"}</FileLink>
                          ) : (
                            <span>No PDF attached</span>
                          )}
                          {contract ? <span>{contract.title}</span> : null}
                          <span>Added {formatTimestamp(i.createdAt)}</span>
                        </div>
                      </td>
                      <td data-label="Amount" style={{ fontWeight: 600 }}>
                        {formatMoney(i.amountCents)}
                        <div className="pt-dt-sub">Issued {formatDate(i.issuedAt)}</div>
                      </td>
                      <td data-label="Balance" className={bal && i.status !== "void" ? undefined : "pt-dt-muted"}>
                        {i.status === "void" ? "—" : formatMoney(bal)}
                        {paidCents(i) && i.status !== "void" ? <div className="pt-dt-sub">{formatMoney(paidCents(i))} paid</div> : null}
                      </td>
                      <td className={s === "overdue" ? "pt-dt-bad" : "pt-dt-muted"} data-label="Due">{formatDate(i.dueAt)}</td>
                      <td data-label="Status">
                        <span className={`pt-status ${invoiceTone[s]}`}>{invoiceStatusLabel[s]}</span>
                        {i.paidAt ? <div className="pt-dt-sub">{formatDate(i.paidAt)}</div> : null}
                      </td>
                      <td>
                        <div className="pt-dt-act">
                          {i.status !== "void" ? (
                            <PaymentsButton
                              invoiceId={id}
                              number={i.number}
                              amountCents={i.amountCents}
                              balanceCents={bal}
                              canRecord={contract?.status === "signed"}
                              blockedReason={
                                contract
                                  ? `"${contract.title}" is no longer accepted, so payments can't be recorded against this invoice.`
                                  : "This invoice isn't linked to an accepted contract, so payments can't be recorded."
                              }
                              payments={(i.payments ?? []).map((p) => ({
                                id: p.id,
                                amountCents: p.amountCents,
                                paidAt: p.paidAt.toISOString(),
                                method: p.method,
                                reference: p.reference,
                                recordedBy: p.recordedBy.name,
                                recordedAt: p.recordedAt.toISOString(),
                              }))}
                            />
                          ) : (
                            <ActionButton action={restoreInvoice} id={id} label="Restore" className="pt-dt-btn quiet-neutral" />
                          )}
                          {i.status !== "void" && !paidCents(i) ? (
                            <ActionButton action={voidInvoice} id={id} label="Cancel" className="pt-dt-btn quiet-neutral" confirm={`Cancel invoice ${i.number}? It will disappear from the client's portal.`} />
                          ) : null}
                          {!paidCents(i) ? (
                            <ActionButton action={deleteInvoice} id={id} label="Delete" className="pt-dt-btn quiet" confirm={`Delete invoice ${i.number}? This can't be undone.`} />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
