import type { Metadata } from "next";
import Link from "next/link";
import { FileTableRow } from "@/components/portal/FileLink";
import { collections } from "@/lib/portal/db";
import { generalDocs } from "@/lib/portal/files";
import { ACTIVE_PROJECT_STATUSES, balanceCents, contractStatusLabel, contractTone, formatMoney, invoiceDisplayStatus, invoiceStatusLabel, invoiceTone, formatBytes, formatDate, formatTimestamp, initials, inviteDisplayStatus, projectStatusLabel, projectTone, roleLabel, serviceLabel } from "@/lib/portal/format";
import { canManageTeam, requireMember } from "@/lib/portal/session";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function PortalOverview({ searchParams }: { searchParams: { welcome?: string; view?: string } }) {
  const { user, membership, org } = await requireMember();
  const c = await collections();

  const [submission, members, invites, docs, projects] = await Promise.all([
    c.submissions.findOne({ orgId: org._id }, { sort: { createdAt: -1 } }),
    c.memberships.find({ orgId: org._id }).sort({ createdAt: 1 }).toArray(),
    c.invites.find({ orgId: org._id, type: "team", status: "pending" }).sort({ createdAt: 1 }).toArray(),
    c.documents.find({ orgId: org._id, sharedWithClient: true, ...generalDocs }).project<{ _id: unknown }>({ _id: 1 }).toArray(),
    c.projects.find({ orgId: org._id }).sort({ createdAt: -1 }).toArray(),
  ]);
  const activeProjects = projects.filter((p) => (ACTIVE_PROJECT_STATUSES as readonly string[]).includes(p.status));
  // Shared files and contracts per project, only needed on the Projects view.
  const projectIds = projects.map((p) => p._id);
  const [projectDocs, projectContracts, projectInvoices] =
    searchParams.view === "projects" && projects.length
      ? await Promise.all([
          c.documents.find({ orgId: org._id, sharedWithClient: true, projectId: { $in: projectIds } }).sort({ createdAt: -1 }).toArray(),
          c.contracts.find({ orgId: org._id, projectId: { $in: projectIds }, status: { $ne: "void" } }).sort({ sentAt: -1 }).toArray(),
          c.invoices.find({ orgId: org._id, status: { $ne: "void" } }).sort({ issuedAt: -1, createdAt: -1 }).toArray(),
        ])
      : [[], [], []];
  // An invoice's project, falling back to its contract's (for invoices made before projects).
  const invoiceProject = (i: (typeof projectInvoices)[number]) =>
    i.projectId ?? projectContracts.find((k) => i.contractId && k._id.equals(i.contractId))?.projectId;
  const users = await c.users.find({ _id: { $in: members.map((m) => m.userId) } }).toArray();
  const pendingInvites = invites.filter((i) => inviteDisplayStatus(i) === "pending");
  const reviewed = org.status === "active";
  const firstName = (user.name || "").split(" ")[0] || "there";

  const view = ["onboarding", "projects", "team"].includes(searchParams.view ?? "") ? searchParams.view : "summary";

  const steps = [
    { label: "Details submitted", done: Boolean(submission) || reviewed },
    { label: "theParse reviews your request and schedules a scoping call", done: reviewed },
    { label: "Your proposal and project are shared here", done: false },
  ];

  const onboardingCard = submission ? (
    <section className="pt-card" id="onboarding">
      <div className="pt-between">
        <h2 className="pt-h2">Your onboarding request</h2>
        <span className={`pt-pill ${reviewed ? "ok" : "warn"}`}>{reviewed ? "Reviewed" : "Under review"}</span>
      </div>
      <div className="pt-chips">
        {submission.services.map((s) => <span key={s} className="pt-chip">{serviceLabel(s)}</span>)}
      </div>
      <p className="pt-quote">{submission.message}</p>
      {submission.attachments.length ? (
        <Link className="pt-link" style={{ fontSize: 14 }} href="/portal/documents">
          {submission.attachments.length} file{submission.attachments.length === 1 ? "" : "s"} you attached · view in Documents →
        </Link>
      ) : null}
      <span className="pt-muted" style={{ fontSize: 13 }}>Submitted {formatDate(submission.createdAt)}</span>
      <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => (
          <li key={s.label} className="pt-row" style={{ flexWrap: "nowrap", fontSize: 14 }}>
            <span className={`pt-pill ${s.done ? "ok" : "neutral"}`} style={{ width: 26, justifyContent: "center", padding: 0 }}>
              {s.done ? "✓" : i + 1}
              <span className="pt-sr">{s.done ? " (done)" : ""}</span>
            </span>
            <span className={s.done ? "" : "pt-muted"}>{s.label}</span>
          </li>
        ))}
      </ol>
    </section>
  ) : (
    <section className="pt-card"><div className="pt-empty">You haven&apos;t submitted an onboarding request yet.</div></section>
  );

  const projectsEmpty = (
    <div className="pt-empty">Your projects will appear here once theParse has set them up. We&apos;ll email you when they&apos;re live.</div>
  );
  const dates = (p: (typeof projects)[number]) =>
    p.startDate || p.dueDate ? `${p.startDate ? `Started ${formatDate(p.startDate)}` : ""}${p.startDate && p.dueDate ? " · " : ""}${p.dueDate ? `Due ${formatDate(p.dueDate)}` : ""}` : null;

  // Compact list for the summary.
  const projectsBlock = (
    <>
      <div className="pt-between">
        <h2 className="pt-h2" id="projects">Projects</h2>
        {projects.length ? <Link className="pt-link" style={{ fontSize: 13 }} href="/portal?view=projects">View all →</Link> : null}
      </div>
      {projects.length ? (
        <div className="pt-list">
          {projects.slice(0, 5).map((p) => (
            <Link key={p._id.toString()} className="pt-item" style={{ color: "inherit", textDecoration: "none" }} href="/portal?view=projects">
              <span className="pt-item-main">{p.name}</span>
              <span className={`pt-status ${projectTone[p.status]}`} style={{ fontSize: 12 }}>{projectStatusLabel[p.status]}</span>
            </Link>
          ))}
        </div>
      ) : (
        projectsEmpty
      )}
    </>
  );

  // Full detail for the Projects view: one card per project with its shared files.
  const projectCards = projects.length ? (
    projects.map((p) => {
      const files = projectDocs.filter((d) => d.projectId?.equals(p._id));
      const contracts = projectContracts.filter((k) => k.projectId?.equals(p._id));
      // Invoices only show once a contract for the project is accepted, as on the Invoices page.
      const invoices = contracts.some((k) => k.status === "signed") ? projectInvoices.filter((i) => invoiceProject(i)?.equals(p._id)) : [];
      return (
        <section key={p._id.toString()} className="pt-card" id={`project-${p._id.toString()}`}>
          <div className="pt-between">
            <h2 className="pt-h2">{p.name}</h2>
            <span className={`pt-pill ${projectTone[p.status]}`}>{projectStatusLabel[p.status]}</span>
          </div>
          {dates(p) ? <span className="pt-muted" style={{ fontSize: 13 }}>{dates(p)}</span> : null}
          {p.description ? <p className="pt-quote">{p.description}</p> : null}
          {contracts.length ? (
            <div>
              <h3 className="pt-label">Contracts</h3>
              <div className="pt-list">
                {contracts.map((k) => (
                  <div key={k._id.toString()} className="pt-item">
                    <span className="pt-item-main">{k.title}</span>
                    {k.status === "awaiting_signature" ? (
                      <Link className="pt-link" style={{ fontSize: 13 }} href="/portal/contracts">Review and accept →</Link>
                    ) : null}
                    <span className={`pt-status ${contractTone[k.status]}`} style={{ fontSize: 12 }}>{contractStatusLabel[k.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {invoices.length ? (
            <div>
              <h3 className="pt-label">Invoices</h3>
              <div className="pt-list">
                {invoices.map((i) => {
                  const s = invoiceDisplayStatus(i);
                  const bal = balanceCents(i);
                  return (
                    <div key={i._id.toString()} className="pt-item">
                      <span className="pt-item-main">
                        {i.number}
                        <span className="pt-muted" style={{ fontSize: 12, marginLeft: 8 }}>
                          {formatMoney(i.amountCents)}{bal > 0 ? ` · ${formatMoney(bal)} due ${formatDate(i.dueAt)}` : ""}
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
              <Link className="pt-link" style={{ fontSize: 13, display: "inline-block", marginTop: 8 }} href="/portal/invoices">All invoices →</Link>
            </div>
          ) : null}
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
            <span className="pt-muted" style={{ fontSize: 13 }}>No documents on this project yet.</span>
          )}
        </section>
      );
    })
  ) : (
    <section className="pt-card">{projectsEmpty}</section>
  );

  const teamBlock = (
    <>
      <h2 className="pt-h2" id="team" style={view === "summary" ? { marginTop: 8 } : undefined}>Team</h2>
      <div className="pt-list">
        {members.map((m) => {
          const u = users.find((x) => x._id.equals(m.userId));
          return (
            <div key={m._id.toString()} className="pt-item">
              <span className="pt-avatar">{initials(u?.name || u?.email || "")}</span>
              <span className="pt-item-main">{u?.name || u?.email}</span>
              <span className="pt-muted" style={{ fontSize: 12 }}>{roleLabel[m.role]}</span>
            </div>
          );
        })}
        {pendingInvites.map((i) => (
          <div key={i._id.toString()} className="pt-item">
            <span className="pt-avatar">{initials(i.name || i.email)}</span>
            <span className="pt-item-main">{i.name || i.email}</span>
            <span className="pt-muted" style={{ fontSize: 12 }}>Invite pending</span>
          </div>
        ))}
      </div>
      {canManageTeam(membership.role) ? <Link className="pt-link" href="/portal/team">Manage team →</Link> : null}
    </>
  );

  if (view !== "summary") {
    const title = view === "onboarding" ? "Onboarding request" : view === "projects" ? "Projects" : "Team";
    return (
      <>
        <div className="pt-head">
          <div>
            <h1 className="pt-h1">{title}</h1>
          </div>
        </div>
        {view === "onboarding" ? (
          onboardingCard
        ) : view === "projects" ? (
          <div className="pt-stack">{projectCards}</div>
        ) : (
          <section className="pt-card">{teamBlock}</section>
        )}
      </>
    );
  }

  return (
    <>
      {searchParams.welcome ? (
        <div className="pt-alert success" role="status">You&apos;re all set. We&apos;ve emailed you a confirmation, and theParse has been notified.</div>
      ) : null}

      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Welcome, {firstName}</h1>
          <p className="pt-sub">{reviewed ? "Here's where things stand." : "Your account is set up. Here's what happens next."}</p>
        </div>
      </div>

      <div className="pt-stats">
        <Link className="pt-stat pt-stat-link" href="/portal?view=projects"><span>Active projects</span><b>{activeProjects.length}</b><span>{projects.length ? `${projects.length} in total · view all →` : "Set up by theParse after review"}</span></Link>
        <div className="pt-stat"><span>Team</span><b>{members.length}</b><span>{pendingInvites.length ? `${pendingInvites.length} invite(s) pending` : "People with access"}</span></div>
        <Link className="pt-stat pt-stat-link" href="/portal/documents"><span>Documents</span><b>{docs.length + (submission?.attachments.length ?? 0)}</b><span>{docs.length ? `${docs.length} from theParse · view all →` : "View all →"}</span></Link>
      </div>

      <div className="pt-grid">
        {submission ? onboardingCard : null}

        <section className="pt-card">
          {projectsBlock}
          {teamBlock}
        </section>
      </div>
    </>
  );
}
