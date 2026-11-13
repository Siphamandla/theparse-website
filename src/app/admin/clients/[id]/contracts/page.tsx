import type { Metadata } from "next";
import ActionButton from "@/components/portal/ActionButton";
import FileLink from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import { contractStatusLabel, contractTone, formatDate, formatDateTime, formatTimestamp } from "@/lib/portal/format";
import { storageConfigured } from "@/lib/portal/storage";
import { deleteContract, markContractSigned, reopenContract, voidContract } from "../../../actions";
import { getClient } from "../data";
import ContractForm from "./ContractForm";

export const metadata: Metadata = { title: "Client contracts" };

export default async function ClientContracts({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const contracts = await (await collections()).contracts.find({ orgId: org._id }).sort({ sentAt: -1 }).toArray();

  return (
    <>
      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Send a contract</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {org.name} reviews and accepts it in their portal (or uploads a paper-signed copy). You&apos;ll get an email when they do, and invoicing opens.
          </p>
        </div>
        {storageConfigured() ? <ContractForm orgId={org._id.toString()} /> : <div className="pt-empty">File storage isn&apos;t configured yet.</div>}
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Contracts</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{contracts.length} total</span>
        </div>
        {contracts.length === 0 ? (
          <div className="pt-dt-empty">No contracts yet.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Contract</th><th>Status</th><th>Sent</th><th>Acceptance</th><th><span className="pt-sr">Actions</span></th></tr>
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
                      <td data-label="Status"><span className={`pt-status ${contractTone[k.status]}`}>{contractStatusLabel[k.status]}</span></td>
                      <td className="pt-dt-muted" data-label="Sent">{formatTimestamp(k.sentAt)}</td>
                      <td data-label="Signed copy">
                        {k.acceptance ? (
                          <div className="pt-dt-two" title={k.acceptance.fileSha256 ? `File SHA-256: ${k.acceptance.fileSha256}` : undefined}>
                            <b style={{ fontWeight: 500 }}>Accepted online as “{k.acceptance.typedName}”</b>
                            <span>{k.acceptance.email} · {formatTimestamp(k.signedAt)}</span>
                            <span>{k.acceptance.ip ? `IP ${k.acceptance.ip}` : "IP not recorded"}{k.acceptance.fileSha256 ? ` · file ${k.acceptance.fileSha256.slice(0, 12)}…` : ""}</span>
                          </div>
                        ) : k.signedFileKey ? (
                          <div className="pt-dt-two">
                            <FileLink className="pt-link pt-dt-file" fileKey={k.signedFileKey} name={k.signedFileName ?? "Signed copy"}>Signed copy (paper)</FileLink>
                            <span>{k.signedBy?.name} · {formatTimestamp(k.signedAt)}</span>
                          </div>
                        ) : k.status === "signed" ? (
                          <span className="pt-dt-muted">Marked accepted by {k.signedBy?.name ?? "staff"}<div className="pt-dt-sub">{formatTimestamp(k.signedAt)}</div></span>
                        ) : (
                          <span className="pt-dt-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="pt-dt-act">
                          {k.status === "awaiting_signature" ? (
                            <ActionButton action={markContractSigned} id={id} label="Mark accepted" className="pt-dt-btn" />
                          ) : (
                            <ActionButton action={reopenContract} id={id} label="Reopen" className="pt-dt-btn quiet-neutral" />
                          )}
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
        )}
      </section>
    </>
  );
}
