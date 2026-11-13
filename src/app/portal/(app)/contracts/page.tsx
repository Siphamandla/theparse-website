import type { Metadata } from "next";
import FileLink from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import { contractStatusLabel, contractTone, formatDate, formatTimestamp } from "@/lib/portal/format";
import { requireMember } from "@/lib/portal/session";
import AcceptContract from "./AcceptContract";

export const metadata: Metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";

export default async function PortalContracts() {
  const { org, user } = await requireMember();
  const contracts = await (await collections()).contracts
    .find({ orgId: org._id, status: { $ne: "void" } })
    .sort({ sentAt: -1 })
    .toArray();
  const waiting = contracts.filter((k) => k.status === "awaiting_signature");

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Contracts</h1>
          <p className="pt-sub">
            {waiting.length
              ? `${waiting.length} ${waiting.length === 1 ? "contract is" : "contracts are"} waiting for you. Review and accept to get started. Invoicing begins once a contract is accepted.`
              : "Agreements between theParse and " + org.name + "."}
          </p>
        </div>
      </div>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 56 }}>
          <h2 className="pt-h2">All contracts</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{contracts.length} total</span>
        </div>
        {contracts.length === 0 ? (
          <div className="pt-dt-empty">Contracts from theParse will appear here when they&apos;re ready for you to accept.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Contract</th><th>Status</th><th>Sent</th><th><span className="pt-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {contracts.map((k) => (
                  <tr key={k._id.toString()}>
                    <td>
                      <div className="pt-dt-two">
                        <b>{k.title}</b>
                        <FileLink className="pt-link pt-dt-file" fileKey={k.fileKey} name={k.fileName}>Open contract</FileLink>
                        {k.signedFileKey ? (
                          <>
                            {" · "}
                            <FileLink className="pt-link pt-dt-file" fileKey={k.signedFileKey} name={k.signedFileName ?? "Signed copy"}>Signed copy</FileLink>
                          </>
                        ) : null}
                        {k.note ? <span className="pt-dt-note">{k.note}</span> : null}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`pt-status ${contractTone[k.status]}`}>{contractStatusLabel[k.status]}</span>
                      {k.signedAt ? <div className="pt-dt-sub">{k.acceptance ? `By ${k.acceptance.typedName} · ` : ""}{formatTimestamp(k.signedAt)}</div> : null}
                    </td>
                    <td className="pt-dt-muted" data-label="Sent">{formatTimestamp(k.sentAt)}</td>
                    <td>
                      <div className="pt-dt-act">
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
