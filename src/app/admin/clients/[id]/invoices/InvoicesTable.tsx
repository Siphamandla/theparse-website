import Link from "next/link";
import type { ObjectId } from "mongodb";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import type { ContractDoc, InvoiceDoc } from "@/lib/portal/db";
import { balanceCents, formatDate, formatMoney, formatTimestamp, invoiceDisplayStatus, invoiceStatusLabel, invoiceTone, paidCents } from "@/lib/portal/format";
import { deleteInvoice, restoreInvoice, voidInvoice } from "../../../actions";
import PaymentsButton from "./PaymentsButton";

/**
 * Staff view of invoices with payments and actions. `contracts` must include each invoice's
 * contract. Passing `projects` adds a Project column.
 */
export default function InvoicesTable({
  invoices,
  contracts,
  projects,
}: {
  invoices: InvoiceDoc[];
  contracts: ContractDoc[];
  projects?: { id: string; name: string }[];
}) {
  const showProject = Boolean(projects);
  const projectName = (pid: ObjectId) => projects?.find((p) => p.id === pid.toString())?.name;
  if (invoices.length === 0) return <div className="pt-dt-empty">No invoices yet.</div>;
  return (
    <div className="pt-dt-wrap">
      <table className="pt-dt-table">
        <thead>
          <tr><th>Invoice</th>{showProject ? <th>Project</th> : null}<th>Amount</th><th>Balance</th><th>Due</th><th>Status</th><th><span className="pt-sr">Actions</span></th></tr>
        </thead>
        <tbody>
          {invoices.map((i) => {
            const id = i._id.toString();
            const s = invoiceDisplayStatus(i);
            const contract = i.contractId ? contracts.find((k) => k._id.equals(i.contractId!)) : null;
            const pid = i.projectId ?? contract?.projectId;
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
                {showProject ? (
                  <td data-label="Project">
                    {pid && projectName(pid) ? (
                      <Link className="pt-link" href={`/admin/clients/${i.orgId.toString()}/projects/${pid.toString()}`}>{projectName(pid)}</Link>
                    ) : (
                      <span className="pt-dt-muted">Not linked</span>
                    )}
                  </td>
                ) : null}
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
  );
}
