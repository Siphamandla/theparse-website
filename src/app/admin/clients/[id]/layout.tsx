import Link from "next/link";
import ActionButton from "@/components/portal/ActionButton";
import RouteTabs from "@/components/portal/RouteTabs";
import { OrgPill } from "@/components/portal/StatusPill";
import { collections } from "@/lib/portal/db";
import { generalDocs } from "@/lib/portal/files";
import { formatDate, initials } from "@/lib/portal/format";
import { archiveOrg, markReviewed, restoreOrg } from "../../actions";
import { getClient } from "./data";

export default async function ClientLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const org = await getClient(params.id);
  const orgId = org._id.toString();
  const c = await collections();
  const [docs, submission, people, notes, contracts, awaiting, invoices, unpaid] = await Promise.all([
    c.documents.countDocuments({ orgId: org._id, ...generalDocs }),
    c.submissions.findOne({ orgId: org._id }, { projection: { attachments: 1 }, sort: { createdAt: -1 } }),
    c.memberships.countDocuments({ orgId: org._id }),
    c.notes.countDocuments({ orgId: org._id }),
    c.contracts.countDocuments({ orgId: org._id, status: { $ne: "void" } }),
    c.contracts.countDocuments({ orgId: org._id, status: "awaiting_signature" }),
    c.invoices.countDocuments({ orgId: org._id, status: { $ne: "void" } }),
    c.invoices.countDocuments({ orgId: org._id, status: "unpaid" }),
  ]);
  const base = `/admin/clients/${orgId}`;

  return (
    <>
      <Link className="pt-back" href="/admin/clients">← All clients</Link>
      <div className="pt-head" style={{ alignItems: "center" }}>
        <div className="pt-row" style={{ flexWrap: "nowrap" }}>
          <span className="pt-mark lg">{initials(org.name)}</span>
          <div>
            <h1 className="pt-h1">{org.name}</h1>
            <div className="pt-row pt-muted" style={{ fontSize: 13, gap: 10, marginTop: 4 }}>
              <OrgPill status={org.status} />
              <span>Client since {formatDate(org.createdAt)}{org.invitedBy ? ` · Invited by ${org.invitedBy.name}` : ""}{org.regNumber ? ` · Reg. ${org.regNumber}` : ""}</span>
            </div>
          </div>
        </div>
        <div className="pt-row">
          {org.status === "archived" ? (
            <ActionButton action={restoreOrg} id={orgId} label="Restore access" className="pt-ghost" />
          ) : (
            <ActionButton action={archiveOrg} id={orgId} label="Archive" className="pt-ghost" confirm={`Archive ${org.name}? Their people will lose portal access.`} />
          )}
          {org.status === "needs_review" ? <ActionButton action={markReviewed} id={orgId} label="Mark as reviewed" className="pt-btn sm" /> : null}
        </div>
      </div>

      <RouteTabs
        label={`${org.name} sections`}
        tabs={[
          { href: base, label: "Overview" },
          { href: `${base}/documents`, label: "Documents", count: docs + (submission?.attachments.length ?? 0) },
          // Totals; orange when something is waiting (acceptance / payment).
          { href: `${base}/contracts`, label: "Contracts", count: contracts, hot: awaiting > 0, hint: awaiting ? `${awaiting} awaiting acceptance` : undefined },
          { href: `${base}/invoices`, label: "Invoices", count: invoices, hot: unpaid > 0, hint: unpaid ? `${unpaid} unpaid` : undefined },
          { href: `${base}/team`, label: "Team", count: people },
          { href: `${base}/notes`, label: "Notes", count: notes },
          { href: `${base}/activity`, label: "Activity" },
        ]}
      />

      {children}
    </>
  );
}
