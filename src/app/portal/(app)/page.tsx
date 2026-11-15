import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/portal/db";
import { generalDocs } from "@/lib/portal/files";
import { clientProjects, projectDates, projectHref } from "@/lib/portal/project-data";
import { ACTIVE_PROJECT_STATUSES, balanceCents, formatDate, formatMoney, initials, inviteDisplayStatus, projectStatusLabel, projectTone, roleLabel, serviceLabel } from "@/lib/portal/format";
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
  // Contracts, invoices and files per project, only needed for the Projects grid.
  const projectData = searchParams.view === "projects" ? await clientProjects(org._id) : [];
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
            <Link key={p._id.toString()} className="pt-item" style={{ color: "inherit", textDecoration: "none" }} href={projectHref(p._id)}>
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

  // Projects view: a grid of summary cards, each opening the project's own page.
  const projectCards = projectData.length ? (
    <div className="pt-projgrid">
      {projectData.map(({ project: p, contracts, invoices, files }) => {
        const dates = projectDates(p, formatDate);
        const toAccept = contracts.filter((k) => k.status === "awaiting_signature").length;
        const owing = invoices.reduce((sum, i) => sum + balanceCents(i), 0);
        const facts = [
          toAccept ? { text: `${toAccept} contract${toAccept === 1 ? "" : "s"} to accept`, hot: true } : null,
          owing ? { text: `${formatMoney(owing)} due`, hot: true } : null,
          { text: `${files.length} ${files.length === 1 ? "document" : "documents"}`, hot: false },
        ].filter((f): f is { text: string; hot: boolean } => Boolean(f));
        return (
          <Link key={p._id.toString()} className="pt-projcard" href={projectHref(p._id)}>
            <div className="pt-between" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
              <h2 className="pt-h2">{p.name}</h2>
              <span className={`pt-pill ${projectTone[p.status]}`}>{projectStatusLabel[p.status]}</span>
            </div>
            {dates ? <span className="pt-muted" style={{ fontSize: 13 }}>{dates}</span> : null}
            {p.description ? <p className="pt-projcard-desc">{p.description}</p> : null}
            <div className="pt-projcard-foot">
              {facts.map((f) => (
                <span key={f.text} className={f.hot ? "hot" : undefined}>{f.text}</span>
              ))}
              <span className="pt-projcard-open" aria-hidden="true">Open →</span>
            </div>
          </Link>
        );
      })}
    </div>
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
          projectCards
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
