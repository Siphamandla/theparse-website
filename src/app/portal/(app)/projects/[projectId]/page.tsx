import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FileLink, { FileTableRow } from "@/components/portal/FileLink";
import { toObjectId } from "@/lib/portal/db";
import {
  balanceCents,
  contractStatusLabel,
  contractTone,
  formatBytes,
  formatDate,
  formatMoney,
  formatTimestamp,
  invoiceDisplayStatus,
  invoiceStatusLabel,
  invoiceTone,
  projectStatusLabel,
  projectTone,
} from "@/lib/portal/format";
import { clientProjects, projectDates } from "@/lib/portal/project-data";
import { requireMember } from "@/lib/portal/session";
import AcceptContract from "../../contracts/AcceptContract";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { projectId: string } }): Promise<Metadata> {
  const { org } = await requireMember();
  const id = toObjectId(params.projectId);
  const [data] = id ? await clientProjects(org._id, id) : [];
  return { title: data?.project.name ?? "Project" };
}

export default async function PortalProject({ params }: { params: { projectId: string } }) {
  const { org, user } = await requireMember();
  const id = toObjectId(params.projectId);
  if (!id) notFound();
  // Scoped to the signed-in member's client, so other clients' projects are a 404.
  const [data] = await clientProjects(org._id, id);
  if (!data) notFound();
  const { project: p, contracts, invoices, files } = data;
  const dates = projectDates(p, formatDate);
  const waiting = contracts.filter((k) => k.status === "awaiting_signature");
  const owing = invoices.reduce((s, i) => s + balanceCents(i), 0);

  return (
    <>
      <Link className="pt-back" href="/portal?view=projects">← All projects</Link>
      <div className="pt-head">
        <div>
          <div className="pt-row" style={{ gap: 10 }}>
            <h1 className="pt-h1">{p.name}</h1>
            <span className={`pt-pill ${projectTone[p.status]}`}>{projectStatusLabel[p.status]}</span>
          </div>
          {dates ? <p className="pt-sub">{dates}</p> : null}
        </div>
      </div>

      {waiting.length ? (
        <div className="pt-alert info" role="status">
          {waiting.length === 1 ? `"${waiting[0].title}" is` : `${waiting.length} contracts are`} waiting for you to sign.{" "}
          <a className="pt-link" href="#contracts">Sign below ↓</a>
        </div>
      ) : null}

      {p.description ? (
        <section className="pt-card">
          <h2 className="pt-h2">About this project</h2>
          <p className="pt-quote">{p.description}</p>
        </section>
      ) : null}

      <div className="pt-grid">
        <section className="pt-card" id="contracts">
          <div className="pt-between">
            <h2 className="pt-h2">Contracts</h2>
            {contracts.length ? <Link className="pt-link" style={{ fontSize: 13 }} href="/portal/contracts">All contracts →</Link> : null}
          </div>
          {contracts.length ? (
            <div className="pt-list">
              {contracts.map((k) => (
                <div key={k._id.toString()} className="pt-item" style={{ flexWrap: "wrap" }}>
                  <span className="pt-item-main">
                    {k.title}
                    <span className="pt-muted" style={{ display: "block", fontSize: 12 }}>
                      {k.status === "signed" && k.signedAt
                        ? `Signed ${formatDate(k.signedAt)}${k.acceptance ? ` by ${k.acceptance.typedName}` : ""}`
                        : `Sent ${formatDate(k.sentAt)}`}
                    </span>
                    <span className="pt-row" style={{ gap: 12, marginTop: 4, fontSize: 13 }}>
                      <FileLink className="pt-link" fileKey={k.fileKey} name={k.fileName}>Open contract</FileLink>
                      {k.signedFileKey ? (
                        <FileLink className="pt-link" fileKey={k.signedFileKey} name={k.signedFileName ?? "Signed copy"}>Signed copy</FileLink>
                      ) : null}
                    </span>
                  </span>
                  <span className={`pt-status ${contractTone[k.status]}`} style={{ fontSize: 12 }}>{contractStatusLabel[k.status]}</span>
                  {k.status === "awaiting_signature" ? (
                    <AcceptContract
                      contractId={k._id.toString()}
                      title={k.title}
                      note={k.note}
                      fileKey={k.fileKey}
                      fileName={k.fileName}
                      defaultName={user.name && !user.name.includes("@") ? user.name : ""}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-empty">theParse will share this project&apos;s contract here.</div>
          )}
        </section>

        <section className="pt-card">
          <div className="pt-between">
            <h2 className="pt-h2">Invoices</h2>
            {owing ? <span className="pt-muted" style={{ fontSize: 13 }}>{formatMoney(owing)} outstanding</span> : null}
          </div>
          {invoices.length ? (
            <div className="pt-list">
              {invoices.map((i) => {
                const s = invoiceDisplayStatus(i);
                const bal = balanceCents(i);
                return (
                  <div key={i._id.toString()} className="pt-item">
                    <span className="pt-item-main">
                      {i.number} · {formatMoney(i.amountCents)}
                      <span className="pt-muted" style={{ display: "block", fontSize: 12 }}>
                        {bal > 0 ? `${formatMoney(bal)} due ${formatDate(i.dueAt)}` : i.paidAt ? `Paid ${formatDate(i.paidAt)}` : `Issued ${formatDate(i.issuedAt)}`}
                      </span>
                    </span>
                    {bal > 0 && i.payUrl ? (
                      <a className="pt-link" style={{ fontSize: 13 }} href={i.payUrl} target="_blank" rel="noopener noreferrer">Pay now →</a>
                    ) : null}
                    <span className={`pt-status ${invoiceTone[s]}`} style={{ fontSize: 12 }}>{invoiceStatusLabel[s]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-empty">
              {contracts.some((k) => k.status === "signed") ? "No invoices for this project yet." : "Invoices appear here once this project's contract is signed."}
            </div>
          )}
        </section>
      </div>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 56 }}>
          <h2 className="pt-h2">Documents</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{files.length} {files.length === 1 ? "file" : "files"}</span>
        </div>
        {files.length ? (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Document</th><th>Added</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <FileTableRow
                    key={f.key}
                    fileKey={f.key}
                    name={f.name}
                    type={f.type}
                    size={formatBytes(f.size)}
                    cells={[{ label: "Added", value: formatTimestamp(f.createdAt), muted: true }]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pt-dt-empty">Specs, designs and reports theParse shares for this project will appear here.</div>
        )}
      </section>
    </>
  );
}
