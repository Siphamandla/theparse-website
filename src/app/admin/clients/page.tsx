import type { Metadata } from "next";
import Link from "next/link";
import type { Filter } from "mongodb";
import { OrgStatus as OrgStatusDot } from "@/components/portal/StatusPill";
import RowLink from "@/components/portal/RowLink";
import TableToolbar from "@/components/portal/TableToolbar";
import { collections, type OrganizationDoc, type OrgStatus } from "@/lib/portal/db";
import { formatDate, initials, serviceLabel } from "@/lib/portal/format";

export const metadata: Metadata = { title: "Clients" };

const tabs: { key: "all" | OrgStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs review" },
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function ClientsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = tabs.some((t) => t.key === searchParams.status) ? (searchParams.status as (typeof tabs)[number]["key"]) : "all";
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const c = await collections();

  const filter: Filter<OrganizationDoc> = {};
  if (status !== "all") filter.status = status;
  if (q) {
    // Match company name, registration number, or any member's name/email.
    const rx = new RegExp(escapeRegex(q), "i");
    const users = await c.users.find({ $or: [{ name: rx }, { email: rx }] }).project({ _id: 1 }).limit(200).toArray();
    const ms = await c.memberships.find({ userId: { $in: users.map((u) => u._id) } }).project({ orgId: 1 }).toArray();
    filter.$or = [{ name: rx }, { regNumber: rx }, { _id: { $in: ms.map((m) => m.orgId) } }];
  }

  const [orgs, counts] = await Promise.all([
    c.orgs.find(filter).sort({ createdAt: -1 }).limit(200).toArray(),
    c.orgs.aggregate<{ _id: OrgStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
  ]);
  const orgIds = orgs.map((o) => o._id);
  const [members, subs, pending] = await Promise.all([
    c.memberships.find({ orgId: { $in: orgIds } }).toArray(),
    c.submissions.find({ orgId: { $in: orgIds } }).project({ orgId: 1, services: 1 }).toArray(),
    c.invites.find({ orgId: { $in: orgIds }, type: "team", status: "pending", expiresAt: { $gt: new Date() } }).project({ orgId: 1 }).toArray(),
  ]);
  const owners = await c.users.find({ _id: { $in: members.filter((m) => m.role === "owner").map((m) => m.userId) } }).toArray();
  const count = (k: string) => (k === "all" ? counts.reduce((s, x) => s + x.n, 0) : counts.find((x) => x._id === k)?.n ?? 0);

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Clients</h1>
          <p className="pt-sub">Every organisation with portal access.</p>
        </div>
        <Link className="pt-btn sm" href="/admin/invites/new">+ Invite client</Link>
      </div>

      <section className="pt-dt">
        <TableToolbar
          basePath="/admin/clients"
          label="Filter clients"
          tabs={tabs.map((t) => ({ key: t.key, label: t.label, count: count(t.key), hot: t.key === "needs_review" }))}
          current={status}
          defaultKey="all"
          q={q}
          searchLabel="Search company, reg. number, person or email"
        />
        {orgs.length === 0 ? (
          <div className="pt-dt-empty">{q ? <>No clients match “{q}”.</> : "No clients here yet."}</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Client</th><th>Owner</th><th>Services</th><th>People</th><th>Status</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {orgs.map((o) => {
                  const oMembers = members.filter((m) => m.orgId.equals(o._id));
                  const owner = owners.find((u) => oMembers.some((m) => m.role === "owner" && m.userId.equals(u._id)));
                  const services = subs.find((s) => s.orgId.equals(o._id))?.services as string[] | undefined;
                  const pend = pending.filter((p) => p.orgId.equals(o._id)).length;
                  return (
                    <RowLink key={o._id.toString()} href={`/admin/clients/${o._id.toString()}`}>
                      <td>
                        <Link href={`/admin/clients/${o._id.toString()}`} className="pt-dt-who">
                          <span className="pt-dt-av" aria-hidden="true">{initials(o.name)}</span>
                          <div><b>{o.name}</b></div>
                        </Link>
                      </td>
                      <td data-label="Owner">
                        <div className="pt-dt-two">{owner?.name || "—"}<span>{owner?.email}</span></div>
                      </td>
                      <td className="pt-dt-muted pt-dt-clip" data-label="Services">{services?.map(serviceLabel).join(", ") || "—"}</td>
                      <td className="pt-dt-muted" data-label="People">{oMembers.length}{pend ? ` + ${pend} invited` : ""}</td>
                      <td data-label="Status"><OrgStatusDot status={o.status} /></td>
                      <td className="pt-dt-muted" data-label="Joined">{formatDate(o.createdAt)}</td>
                    </RowLink>
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
