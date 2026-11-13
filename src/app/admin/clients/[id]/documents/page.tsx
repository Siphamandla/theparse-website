import type { Metadata } from "next";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import { formatBytes, formatDate, formatTimestamp } from "@/lib/portal/format";
import { fileUrl } from "@/lib/portal/preview";
import { storageConfigured } from "@/lib/portal/storage";
import { deleteDocument, toggleDocumentSharing } from "../../../actions";
import { generalDocs } from "@/lib/portal/files";
import { getClient } from "../data";
import DocumentUploader from "./DocumentUploader";

export const metadata: Metadata = { title: "Client documents" };

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

const ext = (name: string) => (name.split(".").pop() ?? "").slice(0, 4).toUpperCase() || "FILE";

export default async function ClientDocuments({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const [docs, submission] = await Promise.all([
    c.documents.find({ orgId: org._id, ...generalDocs }).sort({ createdAt: -1 }).toArray(),
    c.submissions.findOne({ orgId: org._id }, { sort: { createdAt: -1 } }),
  ]);
  const onboarding = submission?.attachments ?? [];
  const total = docs.length + onboarding.length;

  return (
    <>
      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Attach documents</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Proposals, contracts, specs or anything else for {org.name}.
          </p>
        </div>
        <DocumentUploader orgId={org._id.toString()} enabled={storageConfigured()} />
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Files</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{total} {total === 1 ? "file" : "files"}</span>
        </div>
        {total === 0 ? (
          <div className="pt-dt-empty">No documents yet.</div>
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
                {onboarding.map((a) => (
                  <tr key={a.key}>
                    <td>
                      <FileLink className="pt-dt-who" fileKey={a.key} name={a.name} type={a.type}>
                        <span className="pt-ext">{ext(a.name)}</span>
                        <div><b className="pt-dt-name">{a.name}</b><span>{formatBytes(a.size)}</span></div>
                      </FileLink>
                    </td>
                    <td className="pt-dt-muted" data-label="Added by">{submission!.name}</td>
                    <td data-label="Visibility"><span className="pt-status ok">From the client</span></td>
                    <td className="pt-dt-muted" data-label="Added">{formatTimestamp(submission!.createdAt)}</td>
                    <td>
                      <div className="pt-dt-act">
                        <a className="pt-dt-icon" href={fileUrl(a.key)} aria-label={`Download ${a.name}`} title="Download">
                          <DownloadIcon />
                        </a>
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
