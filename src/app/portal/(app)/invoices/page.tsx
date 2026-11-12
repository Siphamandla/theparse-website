import type { Metadata } from "next";
import Link from "next/link";
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
import { requireMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function PortalInvoices() {
  const { org } = await requireMember();
  const c = await collections();
  const [invoices, accepted, awaiting] = await Promise.all([
    c.invoices.find({ orgId: org._id, status: { $ne: "void" } }).sort({ issuedAt: -1, createdAt: -1 }).toArray(),
    c.contracts.countDocuments({ orgId: org._id, status: "signed" }),
    c.contracts.countDocuments({ orgId: org._id, status: "awaiting_signature" }),
  ]);

  const head = (
    <div className="pt-head">
      <div>
        <h1 className="pt-h1">Invoices</h1>
        <p className="pt-sub">Invoices from theParse to {org.name}. Questions about an invoice? Email info@theparse.co.za.</p>
      </div>
    </div>
  );

  // Billing starts once a contract is accepted.
  if (!accepted) {
    return (
      <>
        {head}
        <section className="pt-card">
          <div className="pt-gate">
            <b>Accept your contract first</b>
            <span>
              {awaiting
                ? "theParse has sent you a contract. Once you've reviewed and accepted it, your invoices and payments will appear here."
                : "Once theParse sends your contract and you accept it, your invoices and payments will appear here."}
            </span>
            {awaiting ? <Link className="pt-paybtn" style={{ alignSelf: "flex-start", marginTop: 6 }} href="/portal/contracts">Review contract</Link> : null}
          </div>
        </section>
      </>
    );
  }

  const owing = invoices.reduce((s, i) => s + balanceCents(i), 0);
  const overdue = invoices.filter((i) => invoiceDisplayStatus(i) === "overdue");
  const paid = invoices.reduce((s, i) => s + paidCents(i), 0);

  return (
    <>
      {head}
      <div className="pt-stats">
        <div className="pt-stat"><span>Outstanding</span><b>{formatMoney(owing)}</b><span>{invoices.filter((i) => balanceCents(i) > 0).length} with a balance</span></div>
        <div className="pt-stat"><span>Overdue</span><b style={overdue.length ? { color: "var(--pt-bad)" } : undefined}>{formatMoney(overdue.reduce((s, i) => s + balanceCents(i), 0))}</b><span>{overdue.length ? `${overdue.length} past the due date` : "Nothing overdue"}</span></div>
        <div className="pt-stat"><span>Paid</span><b>{formatMoney(paid)}</b><span>All time</span></div>
      </div>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 56 }}>
          <h2 className="pt-h2">All invoices</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <div className="pt-dt-empty">Invoices from theParse will appear here.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Invoice</th><th>Amount</th><th>Balance</th><th>Due</th><th>Status</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const s = invoiceDisplayStatus(i);
                  const bal = balanceCents(i);
                  const lastPayment = (i.payments ?? []).reduce<Date | null>((d, p) => (!d || p.paidAt > d ? p.paidAt : d), null);
                  return (
                    <tr key={i._id.toString()}>
                      <td>
                        <div className="pt-dt-two">
                          <b>{i.number}</b>
                          {i.fileKey ? (
                            <FileLink className="pt-link pt-dt-file" fileKey={i.fileKey} name={i.fileName ?? `${i.number}.pdf`}>View invoice</FileLink>
                          ) : null}
                          <span>Added {formatTimestamp(i.createdAt)}</span>
                        </div>
                      </td>
                      <td data-label="Amount">
                        {formatMoney(i.amountCents)}
                        <div className="pt-dt-sub">Issued {formatDate(i.issuedAt)}</div>
                      </td>
                      <td data-label="Balance" style={{ fontWeight: 600 }}>
                        {formatMoney(bal)}
                        {paidCents(i) ? <div className="pt-dt-sub" style={{ fontWeight: 400 }}>{formatMoney(paidCents(i))} paid{lastPayment ? ` · last ${formatDate(lastPayment)}` : ""}</div> : null}
                      </td>
                      <td className={s === "overdue" ? "pt-dt-bad" : "pt-dt-muted"} data-label="Due">{formatDate(i.dueAt)}</td>
                      <td data-label="Status">
                        <span className={`pt-status ${invoiceTone[s]}`}>{invoiceStatusLabel[s]}</span>
                        {i.paidAt ? <div className="pt-dt-sub">{formatDate(i.paidAt)}</div> : null}
                      </td>
                      <td>
                        <div className="pt-dt-act">
                          {bal > 0 && i.payUrl ? (
                            <a className="pt-paybtn" href={i.payUrl} target="_blank" rel="noopener noreferrer">Pay now</a>
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
