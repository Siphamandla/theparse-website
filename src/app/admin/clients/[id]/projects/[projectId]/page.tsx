import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import { collections, toObjectId } from "@/lib/portal/db";
import { balanceCents, formatBytes, formatMoney, formatTimestamp, projectStatusLabel, projectTone } from "@/lib/portal/format";
import { fileUrl } from "@/lib/portal/preview";
import { storageConfigured } from "@/lib/portal/storage";
import { deleteDocument, deleteProject, toggleDocumentSharing } from "../../../../actions";
import { getClient } from "../../data";
import ContractForm from "../../contracts/ContractForm";
import ContractsTable from "../../contracts/ContractsTable";
import DocumentUploader from "../../documents/DocumentUploader";
import InvoiceForm from "../../invoices/InvoiceForm";
import InvoicesTable from "../../invoices/InvoicesTable";
import ProjectForm from "../ProjectForm";

export const metadata: Metadata = { title: "Project" };

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

const ext = (name: string) => (name.split(".").pop() ?? "").slice(0, 4).toUpperCase() || "FILE";

/** A stored date as the YYYY-MM-DD a date input expects (dates are saved as local midnight). */
const toInput = (d?: Date) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : undefined;

export default async function ClientProject({
  params,
  searchParams,
}: {
  params: { id: string; projectId: string };
  searchParams: { created?: string };
}) {
  const org = await getClient(params.id);
  const projectId = toObjectId(params.projectId);
  if (!projectId) notFound();
  const c = await collections();
  const project = await c.projects.findOne({ _id: projectId, orgId: org._id });
  if (!project) notFound();
  const [docs, contracts] = await Promise.all([
    c.documents.find({ projectId: project._id }).sort({ createdAt: -1 }).toArray(),
    c.contracts.find({ projectId: project._id }).sort({ sentAt: -1 }).toArray(),
  ]);
  // Includes invoices made before the contract was linked here (they carry only contractId).
  const invoices = await c.invoices
    .find({ $or: [{ projectId: project._id }, { contractId: { $in: contracts.map((k) => k._id) } }] })
    .sort({ issuedAt: -1, createdAt: -1 })
    .toArray();
  const accepted = contracts.filter((k) => k.status === "signed");
  const awaiting = contracts.filter((k) => k.status === "awaiting_signature");
  const owing = invoices.filter((i) => i.status !== "void").reduce((sum, i) => sum + balanceCents(i), 0);
  const closed = project.status === "completed" || project.status === "cancelled";
  const id = project._id.toString();

  return (
    <>
      <Link className="pt-back" href={`/admin/clients/${org._id.toString()}/projects`}>← All projects</Link>

      {searchParams.created ? <div className="pt-alert success" role="status">{searchParams.created}</div> : null}

      <div className="pt-between">
        <div className="pt-row">
          <h2 className="pt-h2" style={{ fontSize: 20 }}>{project.name}</h2>
          <span className={`pt-pill ${projectTone[project.status]}`}>{projectStatusLabel[project.status]}</span>
        </div>
        <ActionButton
          action={deleteProject}
          id={id}
          label="Delete project"
          className="pt-ghost"
          confirm={`Delete ${project.name}${docs.length ? ` and its ${docs.length} file${docs.length === 1 ? "" : "s"}` : ""}? This can't be undone.${contracts.length ? " (Projects with contracts can't be deleted.)" : ""}`}
        />
      </div>

      <section className="pt-card">
        <h2 className="pt-h2">Details</h2>
        <ProjectForm
          key={project.updatedAt.toISOString()}
          projectId={id}
          defaults={{
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: toInput(project.startDate),
            dueDate: toInput(project.dueDate),
          }}
        />
      </section>

      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Send a contract for this project</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {org.name} reviews and accepts it in their portal. You&apos;ll get an email when they do, and invoicing opens.
          </p>
        </div>
        {!storageConfigured() ? (
          <div className="pt-empty">File storage isn&apos;t configured yet.</div>
        ) : closed ? (
          <div className="pt-empty">This project is {projectStatusLabel[project.status].toLowerCase()}. Change its status to send a new contract.</div>
        ) : (
          <ContractForm orgId={org._id.toString()} projectId={id} />
        )}
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Contracts</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{contracts.length} total</span>
        </div>
        <ContractsTable contracts={contracts} />
      </section>

      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Add an invoice for this project</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Billed under one of this project&apos;s accepted contracts. {org.name} sees and pays it in their portal.
          </p>
        </div>
        {accepted.length ? (
          <InvoiceForm orgId={org._id.toString()} projectId={id} contracts={accepted.map((k) => ({ id: k._id.toString(), title: k.title }))} />
        ) : (
          <div className="pt-gate">
            <b>Waiting for an accepted contract</b>
            <span>
              {awaiting.length
                ? `${org.name} hasn't accepted ${awaiting.length === 1 ? `"${awaiting[0].title}"` : "this project's contracts"} yet. Invoicing opens once they do.`
                : "Send a contract for this project first. Invoicing opens once the client accepts it."}
            </span>
          </div>
        )}
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Invoices</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{invoices.length} total{owing ? ` · ${formatMoney(owing)} outstanding` : ""}</span>
        </div>
        <InvoicesTable invoices={invoices} contracts={contracts} />
      </section>

      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Add documents</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Specs, designs, reports or anything else for this project. Shared files also appear in {org.name}&apos;s Documents.
          </p>
        </div>
        <DocumentUploader orgId={org._id.toString()} projectId={id} enabled={storageConfigured()} />
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Project files</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{docs.length} {docs.length === 1 ? "file" : "files"}</span>
        </div>
        {docs.length === 0 ? (
          <div className="pt-dt-empty">No files on this project yet.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Name</th><th>Added by</th><th>Visibility</th><th>Added</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d._id.toString()}>
                    <td>
                      <FileLink className="pt-dt-who" fileKey={d.key} name={d.name} type={d.type}>
                        <span className="pt-ext">{ext(d.name)}</span>
                        <div><b className="pt-dt-name">{d.name}</b><span>{formatBytes(d.size)}</span></div>
                      </FileLink>
                    </td>
                    <td className="pt-dt-muted" data-label="Added by">{d.uploadedBy.name}</td>
                    <td data-label="Visibility">
                      <span className={`pt-status ${d.sharedWithClient ? "ok" : "neutral"}`}>{d.sharedWithClient ? "Shared with client" : "Internal"}</span>
                    </td>
                    <td className="pt-dt-muted" data-label="Added">{formatTimestamp(d.createdAt)}</td>
                    <td>
                      <div className="pt-dt-act">
                        <a className="pt-dt-icon" href={fileUrl(d.key)} aria-label={`Download ${d.name}`} title="Download">
                          <DownloadIcon />
                        </a>
                        <ActionButton action={toggleDocumentSharing} id={d._id.toString()} label={d.sharedWithClient ? "Make internal" : "Share"} className="pt-dt-btn quiet-neutral" />
                        <ActionButton action={deleteDocument} id={d._id.toString()} label="Delete" className="pt-dt-btn quiet" confirm={`Delete ${d.name}? This can't be undone.`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
