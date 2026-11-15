import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/portal/db";
import { balanceCents, formatMoney, invoiceDisplayStatus, paidCents } from "@/lib/portal/format";
import { storageConfigured } from "@/lib/portal/storage";
import { getClient } from "../data";
import InvoiceForm from "./InvoiceForm";
import InvoicesTable from "./InvoicesTable";

export const metadata: Metadata = { title: "Client invoices" };

export default async function ClientInvoices({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const [invoices, contracts, projects] = await Promise.all([
    c.invoices.find({ orgId: org._id }).sort({ issuedAt: -1, createdAt: -1 }).toArray(),
    c.contracts.find({ orgId: org._id }).sort({ sentAt: -1 }).toArray(),
    c.projects.find({ orgId: org._id }).project<{ _id: import("mongodb").ObjectId; name: string }>({ name: 1 }).toArray(),
  ]);
  const projectName = (id?: import("mongodb").ObjectId) => (id ? projects.find((p) => p._id.equals(id))?.name : undefined);
  /** "Project: Contract title", or just the title for contracts not linked to a project. */
  const contractLabel = (k: (typeof contracts)[number]) => (projectName(k.projectId) ? `${projectName(k.projectId)}: ${k.title}` : k.title);
  // Only contracts linked to a project can be invoiced.
  const accepted = contracts.filter((k) => k.status === "signed" && projectName(k.projectId));
  const unlinkedAccepted = contracts.filter((k) => k.status === "signed" && !projectName(k.projectId));
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
            Every invoice is billed under an accepted contract, and belongs to that contract&apos;s project. {org.name} sees and pays it in their portal.
          </p>
        </div>
        {accepted.length ? (
          <>
            <InvoiceForm
              orgId={org._id.toString()}
              contracts={accepted.map((k) => ({ id: k._id.toString(), title: contractLabel(k) }))}
            />
            {unlinkedAccepted.length ? (
              <p className="pt-muted" style={{ fontSize: 13 }}>
                {unlinkedAccepted.length} accepted contract{unlinkedAccepted.length === 1 ? " isn't" : "s aren't"} linked to a project yet, so {unlinkedAccepted.length === 1 ? "it's" : "they're"} not listed. <Link className="pt-link" href={`${base}/contracts`}>Link in Contracts →</Link>
              </p>
            ) : null}
            {!storageConfigured() ? <p className="pt-muted" style={{ fontSize: 13 }}>File storage isn&apos;t configured, so you can&apos;t attach PDFs yet.</p> : null}
          </>
        ) : (
          <div className="pt-gate">
            <b>{unlinkedAccepted.length ? "Link the accepted contract to a project" : "Waiting for an accepted contract"}</b>
            <span>
              {unlinkedAccepted.length
                ? `Invoices are per project. Link "${unlinkedAccepted[0].title}"${unlinkedAccepted.length > 1 ? ` and ${unlinkedAccepted.length - 1} more` : ""} to a project to invoice under it.`
                : awaiting.length
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
        <InvoicesTable invoices={invoices} contracts={contracts} projects={projects.map((p) => ({ id: p._id.toString(), name: p.name }))} />
      </section>
    </>
  );
}
