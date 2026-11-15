import Link from "next/link";
import type { ObjectId } from "mongodb";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import type { ContractDoc } from "@/lib/portal/db";
import { contractStatusLabel, contractTone, formatTimestamp } from "@/lib/portal/format";
import { deleteContract, linkContractToProject, reopenContract, voidContract } from "../../../actions";

/**
 * Staff view of contracts with their actions. Passing `projects` (the client's projects) adds a
 * Project column, where contracts sent before projects existed can be linked to one.
 */
export default function ContractsTable({ contracts, projects: projectList }: { contracts: ContractDoc[]; projects?: { id: string; name: string }[] }) {
  const showProject = Boolean(projectList);
  const projects = projectList ?? [];
  const projectName = (pid: ObjectId) => projects.find((p) => p.id === pid.toString())?.name;
  if (contracts.length === 0) return <div className="pt-dt-empty">No contracts yet.</div>;
  return (
    <div className="pt-dt-wrap">
      <table className="pt-dt-table">
        <thead>
          <tr><th>Contract</th>{showProject ? <th>Project</th> : null}<th>Status</th><th>Sent</th><th>Signature</th><th><span className="pt-sr">Actions</span></th></tr>
        </thead>
        <tbody>
          {contracts.map((k) => {
            const id = k._id.toString();
            return (
              <tr key={id}>
                <td>
                  <div className="pt-dt-two">
                    <b>{k.title}</b>
                    <FileLink className="pt-link pt-dt-file" fileKey={k.fileKey} name={k.fileName}>{k.fileName}</FileLink>
                  </div>
                </td>
                {showProject ? (
                  <td data-label="Project">
                    {k.projectId && projectName(k.projectId) ? (
                      <Link className="pt-link" href={`/admin/clients/${k.orgId.toString()}/projects/${k.projectId.toString()}`}>{projectName(k.projectId)}</Link>
                    ) : projects.length ? (
                      <form action={linkContractToProject} className="pt-row" style={{ gap: 6, flexWrap: "nowrap" }}>
                        <input type="hidden" name="id" value={id} />
                        <select className="pt-input" name="projectId" aria-label={`Project for ${k.title}`} required defaultValue="" style={{ minHeight: 34, fontSize: 13, padding: "0 8px" }}>
                          <option value="" disabled>Not linked: choose…</option>
                          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button type="submit" className="pt-dt-btn quiet-neutral">Link</button>
                      </form>
                    ) : (
                      <span className="pt-dt-muted">Not linked</span>
                    )}
                  </td>
                ) : null}
                <td data-label="Status"><span className={`pt-status ${contractTone[k.status]}`}>{contractStatusLabel[k.status]}</span></td>
                <td className="pt-dt-muted" data-label="Sent">{formatTimestamp(k.sentAt)}</td>
                <td data-label="Signature">
                  {k.acceptance || k.signedFileKey ? (
                    <div className="pt-dt-two" title={k.acceptance?.fileSha256 ? `Contract file SHA-256: ${k.acceptance.fileSha256}` : undefined}>
                      {k.acceptance ? <b style={{ fontWeight: 500 }}>Signed as “{k.acceptance.typedName}”</b> : null}
                      {k.signedFileKey ? (
                        <FileLink className="pt-link pt-dt-file" fileKey={k.signedFileKey} name={k.signedFileName ?? "Signed copy"}>Signed copy</FileLink>
                      ) : null}
                      <span>{k.acceptance?.email ?? k.signedBy?.name} · {formatTimestamp(k.signedAt)}</span>
                      {k.acceptance ? (
                        <span>{k.acceptance.ip ? `IP ${k.acceptance.ip}` : "IP not recorded"}{k.acceptance.fileSha256 ? ` · file ${k.acceptance.fileSha256.slice(0, 12)}…` : ""}</span>
                      ) : null}
                    </div>
                  ) : k.status === "signed" ? (
                    // Older contracts marked accepted by staff, before signing required both.
                    <span className="pt-dt-muted">Marked accepted by {k.signedBy?.name ?? "staff"}<div className="pt-dt-sub">{formatTimestamp(k.signedAt)}</div></span>
                  ) : k.status === "awaiting_signature" ? (
                    <span className="pt-dt-muted">Waiting for the client</span>
                  ) : (
                    <span className="pt-dt-muted">—</span>
                  )}
                </td>
                <td>
                  <div className="pt-dt-act">
                    {k.status === "signed" ? (
                      <ActionButton action={reopenContract} id={id} label="Reopen" className="pt-dt-btn quiet-neutral" confirm={`Reopen "${k.title}"? The client will need to sign it and attach a signed copy again.`} />
                    ) : null}
                    {k.status !== "void" ? (
                      <ActionButton action={voidContract} id={id} label="Cancel" className="pt-dt-btn quiet-neutral" confirm={`Cancel "${k.title}"? It will disappear from the client's portal.`} />
                    ) : null}
                    <ActionButton action={deleteContract} id={id} label="Delete" className="pt-dt-btn quiet" confirm={`Delete "${k.title}" and its files? This can't be undone.`} />
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
