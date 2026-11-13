import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/portal/AppShell";
import Icon from "@/components/portal/icons";
import { collections } from "@/lib/portal/db";
import { initials } from "@/lib/portal/format";
import { requireStaff } from "@/lib/portal/session";
import { signOutAction } from "../portal/actions";
import "@/styles/portal.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | theParse admin" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const c = await collections();
  const [rerequested, needsReview, newLeads] = await Promise.all([
    c.invites.countDocuments({ status: "rerequested" }),
    c.orgs.countDocuments({ status: "needs_review" }),
    c.leads.countDocuments({ status: { $nin: ["invited", "archived"] } }),
  ]);

  return (
    <div className="pt-body">
      <AppShell
        label="Admin"
        homeHref="/admin"
        context="theParse admin"
        tag="ADMIN"
        sections={[
          {
            href: "/admin",
            label: "Overview",
            icon: "overview",
            exact: true,
            groups: [
              {
                items: [
                  { label: "Summary", href: "/admin" },
                  { label: "Contracts & billing", href: "/admin#billing" },
                  { label: "Needs your attention", href: "/admin#attention" },
                  { label: "Recent activity", href: "/admin#activity" },
                ],
              },
            ],
          },
          {
            href: "/admin/clients",
            label: "Clients",
            icon: "clients",
            count: needsReview,
            groups: [
              { items: [{ label: "All clients", href: "/admin/clients" }] },
            ],
          },
          {
            href: "/admin/invites",
            label: "Invites",
            icon: "invites",
            count: rerequested,
            groups: [
              {
                items: [
                  { label: "Sent invites", href: "/admin/invites", count: rerequested, hot: true },
                  { label: "Invite a client", href: "/admin/invites/new" },
                ],
              },
            ],
          },
          {
            href: "/admin/leads",
            label: "Leads",
            icon: "leads",
            count: newLeads,
            groups: [{ items: [{ label: "Enquiries", href: "/admin/leads", count: newLeads, hot: true }] }],
          },
        ]}
        user={{ name: user.displayName, email: user.email, initials: initials(user.displayName), detail: "theParse staff" }}
        signOut={signOutAction}
        panelFooter={
          <Link href="/" className="pt-panel-ext">
            <Icon name="external" size={16} />
            View public website
          </Link>
        }
      >
        {children}
      </AppShell>
    </div>
  );
}
