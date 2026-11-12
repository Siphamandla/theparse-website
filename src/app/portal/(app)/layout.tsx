import AppShell, { type RailSection } from "@/components/portal/AppShell";
import { collections } from "@/lib/portal/db";
import { generalDocs } from "@/lib/portal/files";
import { initials, roleLabel } from "@/lib/portal/format";
import { canManageTeam, requireMember } from "@/lib/portal/session";
import { signOutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, org } = await requireMember();

  if (org.status === "archived") {
    return (
      <div className="pt-center">
        <div className="pt-card" style={{ textAlign: "center" }}>
          <h1 className="pt-h1">This account is closed</h1>
          <p className="pt-muted">{org.name}&apos;s portal access has been archived. Contact info@theparse.co.za if this is a mistake.</p>
          <form action={signOutAction}><button className="pt-ghost">Sign out</button></form>
        </div>
      </div>
    );
  }

  const c = await collections();
  const [submission, sharedDocs, toSign, unpaid] = await Promise.all([
    c.submissions.findOne({ orgId: org._id }, { projection: { attachments: 1 } }),
    c.documents.countDocuments({ orgId: org._id, sharedWithClient: true, ...generalDocs }),
    c.contracts.countDocuments({ orgId: org._id, status: "awaiting_signature" }),
    c.invoices.countDocuments({ orgId: org._id, status: "unpaid" }),
  ]);
  const hasSubmission = Boolean(submission);
  const fileCount = sharedDocs + (submission?.attachments?.length ?? 0);

  const sections: RailSection[] = [
    {
      href: "/portal",
      label: "Overview",
      icon: "overview",
      exact: true,
      groups: [
        {
          items: [
            { label: "Summary", href: "/portal" },
            ...(hasSubmission ? [{ label: "Onboarding request", href: "/portal#onboarding" }] : []),
            { label: "Projects", href: "/portal#projects" },
            { label: "Team", href: "/portal#team" },
          ],
        },
      ],
    },
  ];
  sections.push({
    href: "/portal/documents",
    label: "Documents",
    icon: "documents",
    groups: [{ items: [{ label: "All documents", href: "/portal/documents", count: fileCount }] }],
  });
  sections.push(
    {
      href: "/portal/contracts",
      label: "Contracts",
      icon: "contracts",
      count: toSign,
      groups: [{ items: [{ label: "All contracts", href: "/portal/contracts", count: toSign, hot: true }] }],
    },
    {
      href: "/portal/invoices",
      label: "Invoices",
      icon: "invoices",
      count: unpaid,
      groups: [{ items: [{ label: "All invoices", href: "/portal/invoices", count: unpaid, hot: true }] }],
    },
  );
  if (canManageTeam(membership.role)) {
    sections.push({
      href: "/portal/team",
      label: "Team",
      icon: "team",
      groups: [
        {
          items: [
            { label: "Members", href: "/portal/team" },
            { label: "Invite someone", href: "/portal/team#invite" },
          ],
        },
      ],
    });
  }

  return (
    <AppShell
      label="Portal"
      homeHref="/portal"
      context={org.name}
      contextStatus={org.status === "active" ? { label: "Active", tone: "ok" } : { label: "Under review", tone: "warn" }}
      sections={sections}
      user={{
        name: user.displayName,
        email: user.email,
        initials: initials(user.displayName),
        detail: `${roleLabel[membership.role]} · ${org.name}`,
      }}
      signOut={signOutAction}
      panelFooter={
        <div className="pt-help">
          <b>Need help?</b>
          <span>Email <a className="pt-link" href="mailto:info@theparse.co.za">info@theparse.co.za</a> and we&apos;ll get back to you.</span>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
