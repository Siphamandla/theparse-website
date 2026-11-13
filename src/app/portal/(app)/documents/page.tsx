import type { Metadata } from "next";
import { FileTableRow } from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import { formatBytes, formatDate, formatTimestamp } from "@/lib/portal/format";
import { generalDocs } from "@/lib/portal/files";
import { requireMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function PortalDocuments() {
  const { org } = await requireMember();
  const c = await collections();
  const [docs, submission] = await Promise.all([
    c.documents.find({ orgId: org._id, sharedWithClient: true, ...generalDocs }).sort({ createdAt: -1 }).limit(200).toArray(),
    c.submissions.findOne({ orgId: org._id }, { sort: { createdAt: -1 }, projection: { attachments: 1, createdAt: 1 } }),
  ]);

  // theParse's shared files first (newest first), then what the client attached at sign-up.
  const files = [
    ...docs.map((d) => ({ key: d.key, name: d.name, type: d.type, size: d.size, at: d.createdAt, from: "theParse" })),
    ...(submission?.attachments ?? []).map((a) => ({ key: a.key, name: a.name, type: a.type, size: a.size, at: submission!.createdAt, from: "You, at sign-up" })),
  ];

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Documents</h1>
          <p className="pt-sub">Files theParse has shared with {org.name}, and anything you sent us when you signed up.</p>
        </div>
      </div>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 56 }}>
          <h2 className="pt-h2">All documents</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </div>
        {files.length === 0 ? (
          <div className="pt-dt-empty">Proposals, contracts and other files theParse shares with you will appear here.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Document</th><th>From</th><th>Added</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <FileTableRow
                    key={f.key}
                    fileKey={f.key}
                    name={f.name}
                    type={f.type}
                    size={formatBytes(f.size)}
                    cells={[
                      { label: "From", value: f.from, muted: true },
                      { label: "Added", value: formatTimestamp(f.at), muted: true },
                    ]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
