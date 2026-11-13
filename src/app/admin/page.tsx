import type { Metadata } from "next";
import Link from "next/link";
import ActionButton from "@/components/portal/ActionButton";
import { collections } from "@/lib/portal/db";
import { balanceCents, formatDate, formatDateTime, formatMoney, invoiceDisplayStatus } from "@/lib/portal/format";
import { requireStaff } from "@/lib/portal/session";
import { resendInviteAction } from "./actions";

export const metadata: Metadata = { title: "Overview" };

const actionText: Record<string, string> = {
  "invite.client.sent": "sent a client invite to",
  "invite.team.sent": "invited",
  "invite.team.accepted": "accepted their invite",
  "invite.resent": "re-sent an invite to",
  "invite.revoked": "revoked the invite for",
  "invite.rerequested": "asked for a new invite link",
  "onboarding.completed": "completed onboarding",
  "org.reviewed": "marked a client as reviewed",
  "org.archived": "archived a client",
  "client.regnumber": "set the registration number to",
  "org.restored": "restored a client",
  "member.removed": "removed",
  "member.role_changed": "changed a role to",
  "file.downloaded": "downloaded",
  "lead.archived": "archived a lead",
  "file.viewed": "viewed",
  "document.added": "added a document:",
  "document.deleted": "deleted a document:",
  "document.shared": "shared a document:",
  "document.unshared": "made a document internal:",
  "contract.sent": "sent a contract:",
  "contract.accepted": "accepted a contract:",
  "contract.signed_by_client": "uploaded a signed contract:",
  "contract.marked_accepted": "marked a contract as accepted:",
  "contract.reopened": "reopened a contract:",
  "contract.cancelled": "cancelled a contract:",
  "contract.deleted": "deleted a contract:",
  "invoice.added": "added invoice",
  "invoice.payment_recorded": "recorded a payment on",
  "invoice.payment_deleted": "removed a payment from",
  "invoice.cancelled": "cancelled invoice",
  "invoice.restored": "restored invoice",
  "invoice.deleted": "deleted invoice",
};

const DAY = 86_400_000;

/** Start of the current month in South African time (UTC+2, no daylight saving). */
function monthStartSAST(now: Date) {
  const sast = new Date(now.getTime() + 2 * 3_600_000);
  return new Date(Date.UTC(sast.getUTCFullYear(), sast.getUTCMonth(), 1) - 2 * 3_600_000);
}

export default async function AdminOverview() {
  const user = await requireStaff();
  const c = await collections();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const monthStart = monthStartSAST(now);
  const monthName = now.toLocaleDateString("en-ZA", { month: "long", timeZone: "Africa/Johannesburg" });

  const [activeClients, pendingInvites, reviewOrgs, rerequested, clientTeamAdds, newLeads, activity, awaitingContracts, acceptedThisMonth, invoices] = await Promise.all([
    c.orgs.countDocuments({ status: { $ne: "archived" } }),
    c.invites.countDocuments({ status: "pending", expiresAt: { $gt: now } }),
    c.orgs.find({ status: "needs_review" }).sort({ createdAt: -1 }).limit(10).toArray(),
    c.invites.find({ status: "rerequested" }).sort({ rerequestedAt: -1 }).limit(10).toArray(),
    c.audit.find({ action: "invite.team.sent", "actor.staff": false, at: { $gt: weekAgo } }).sort({ at: -1 }).limit(10).toArray(),
    c.leads.countDocuments({ status: { $nin: ["invited", "archived"] } }),
    c.audit.find({ action: { $nin: ["file.downloaded", "file.viewed"] } }).sort({ at: -1 }).limit(12).toArray(),
    c.contracts.find({ status: "awaiting_signature" }).project<{ _id: unknown; orgId: never; title: string; sentAt: Date }>({ orgId: 1, title: 1, sentAt: 1 }).sort({ sentAt: 1 }).toArray(),
    c.contracts.countDocuments({ status: "signed", signedAt: { $gte: monthStart } }),
    c.invoices
      .find({ status: { $ne: "void" } })
      .project<{ _id: unknown; orgId: never; number: string; amountCents: number; payments?: { amountCents: number; paidAt: Date }[]; status: string; dueAt: Date; issuedAt: Date }>({
        orgId: 1, number: 1, amountCents: 1, payments: 1, status: 1, dueAt: 1, issuedAt: 1,
      })
      .toArray(),
  ]);

  // Contracts & billing KPIs
  const withBalance = invoices.filter((i) => balanceCents(i) > 0);
  const outstanding = withBalance.reduce((sum, i) => sum + balanceCents(i), 0);
  const overdueInv = invoices.filter((i) => invoiceDisplayStatus(i) === "overdue").sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const overdueTotal = overdueInv.reduce((sum, i) => sum + balanceCents(i), 0);
  const issuedThisMonth = invoices.filter((i) => i.issuedAt >= monthStart);
  const invoicedThisMonth = issuedThisMonth.reduce((sum, i) => sum + i.amountCents, 0);
  const paymentsThisMonth = invoices.flatMap((i) => i.payments ?? []).filter((p) => p.paidAt >= monthStart);
  const receivedThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amountCents, 0);
  const oldestWaitDays = awaitingContracts.length ? Math.floor((now.getTime() - awaitingContracts[0].sentAt.getTime()) / DAY) : 0;
  const staleContracts = awaitingContracts.filter((k) => now.getTime() - k.sentAt.getTime() > 7 * DAY);
  const actOrgIds = [...clientTeamAdds, ...activity, ...overdueInv.slice(0, 5), ...staleContracts.slice(0, 5)].map((a) => a.orgId).filter(Boolean);
  const actOrgs = await c.orgs.find({ _id: { $in: actOrgIds as never[] } }).toArray();
  const orgName = (id?: unknown) => actOrgs.find((o) => id && o._id.equals(id as never))?.name;

  const hour = Number(now.toLocaleString("en-ZA", { hour: "numeric", hour12: false, timeZone: "Africa/Johannesburg" }));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const attention =
    reviewOrgs.length + rerequested.length + clientTeamAdds.length + (newLeads ? 1 : 0) + Math.min(overdueInv.length, 5) + Math.min(staleContracts.length, 5);
  const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">{greeting}, {user.displayName.split(" ")[0]}</h1>
          <p className="pt-sub">{now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" })}</p>
        </div>
        <Link className="pt-btn sm" href="/admin/invites/new">+ Invite client</Link>
      </div>

      <div className="pt-stats">
        <div className="pt-stat"><span>Clients</span><b>{activeClients}</b><span>{reviewOrgs.length} awaiting review</span></div>
        <div className="pt-stat"><span>Pending invites</span><b>{pendingInvites}</b><span>{rerequested.length} re-requested</span></div>
        <div className="pt-stat"><span>New leads</span><b>{newLeads}</b><span>From the contact form</span></div>
      </div>

      <section className="pt-kpis" id="billing" aria-labelledby="kpi-billing">
        <div className="pt-between">
          <h2 className="pt-h2" id="kpi-billing">Contracts &amp; billing</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>“This month” = {monthName}</span>
        </div>
        <div className="pt-stats">
          <div className="pt-stat">
            <span>Awaiting acceptance</span>
            <b style={awaitingContracts.length ? { color: "var(--pt-warn)" } : undefined}>{awaitingContracts.length}</b>
            <span>{awaitingContracts.length ? `Oldest waiting ${days(oldestWaitDays)}` : "No contracts waiting"}</span>
          </div>
          <div className="pt-stat">
            <span>Accepted this month</span>
            <b>{acceptedThisMonth}</b>
            <span>Since 1 {monthName}</span>
          </div>
          <div className="pt-stat">
            <span>Outstanding</span>
            <b>{formatMoney(outstanding)}</b>
            <span>{withBalance.length} invoice{withBalance.length === 1 ? "" : "s"} with a balance</span>
          </div>
          <div className="pt-stat">
            <span>Overdue</span>
            <b style={overdueInv.length ? { color: "var(--pt-bad)" } : undefined}>{formatMoney(overdueTotal)}</b>
            <span>{overdueInv.length ? `${overdueInv.length} invoice${overdueInv.length === 1 ? "" : "s"} past due` : "Nothing overdue"}</span>
          </div>
          <div className="pt-stat">
            <span>Invoiced this month</span>
            <b>{formatMoney(invoicedThisMonth)}</b>
            <span>{issuedThisMonth.length} invoice{issuedThisMonth.length === 1 ? "" : "s"} issued</span>
          </div>
          <div className="pt-stat">
            <span>Received this month</span>
            <b style={receivedThisMonth ? { color: "var(--pt-ok)" } : undefined}>{formatMoney(receivedThisMonth)}</b>
            <span>{paymentsThisMonth.length} payment{paymentsThisMonth.length === 1 ? "" : "s"} recorded</span>
          </div>
        </div>
      </section>

      <div className="pt-grid">
        <section className="pt-card" id="attention">
          <h2 className="pt-h2">Needs your attention</h2>
          {attention === 0 ? <div className="pt-empty">All clear.</div> : null}
          <div className="pt-list">
            {reviewOrgs.map((o) => (
              <div key={o._id.toString()} className="pt-item">
                <span className="pt-pill acc">Review</span>
                <div className="pt-item-main">{o.name} completed onboarding<small>{formatDate(o.createdAt)}</small></div>
                <Link className="pt-link" style={{ fontSize: 13 }} href={`/admin/clients/${o._id.toString()}`}>Review</Link>
              </div>
            ))}
            {rerequested.map((i) => (
              <div key={i._id.toString()} className="pt-item">
                <span className="pt-pill warn">Link request</span>
                <div className="pt-item-main">{i.prefill?.company || i.email} asked for a new invite link<small>{formatDateTime(i.rerequestedAt)}</small></div>
                <ActionButton action={resendInviteAction} id={i._id.toString()} label="Send new link" />
              </div>
            ))}
            {clientTeamAdds.map((a) => (
              <div key={a._id!.toString()} className="pt-item">
                <span className="pt-pill info">Team change</span>
                <div className="pt-item-main">{a.actor.name} invited {a.detail}<small>{orgName(a.orgId)} · {formatDateTime(a.at)}</small></div>
                {a.orgId ? <Link className="pt-link" style={{ fontSize: 13 }} href={`/admin/clients/${a.orgId.toString()}`}>View</Link> : null}
              </div>
            ))}
            {overdueInv.slice(0, 5).map((i) => (
              <div key={String(i._id)} className="pt-item">
                <span className="pt-pill bad">Overdue</span>
                <div className="pt-item-main">
                  {orgName(i.orgId) ?? "Client"} · invoice {i.number} · {formatMoney(balanceCents(i))} owing
                  <small>Due {formatDate(i.dueAt)} ({days(Math.floor((now.getTime() - i.dueAt.getTime()) / DAY))} ago)</small>
                </div>
                <Link className="pt-link" style={{ fontSize: 13 }} href={`/admin/clients/${String(i.orgId)}/invoices`}>Open</Link>
              </div>
            ))}
            {staleContracts.slice(0, 5).map((k) => (
              <div key={String(k._id)} className="pt-item">
                <span className="pt-pill warn">Contract</span>
                <div className="pt-item-main">
                  {orgName(k.orgId) ?? "Client"} hasn&apos;t accepted “{k.title}”
                  <small>Sent {formatDate(k.sentAt)} ({days(Math.floor((now.getTime() - k.sentAt.getTime()) / DAY))} ago)</small>
                </div>
                <Link className="pt-link" style={{ fontSize: 13 }} href={`/admin/clients/${String(k.orgId)}/contracts`}>Open</Link>
              </div>
            ))}
            {newLeads ? (
              <div className="pt-item">
                <span className="pt-pill neutral">Leads</span>
                <div className="pt-item-main">{newLeads} new contact form {newLeads === 1 ? "enquiry" : "enquiries"}</div>
                <Link className="pt-link" style={{ fontSize: 13 }} href="/admin/leads">Open leads</Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="pt-card" id="activity">
          <h2 className="pt-h2">Recent activity</h2>
          {activity.length === 0 ? <div className="pt-empty">No activity yet.</div> : null}
          <div className="pt-list">
            {activity.map((a) => (
              <div key={a._id!.toString()} className="pt-item" style={{ alignItems: "flex-start" }}>
                <div className="pt-item-main">
                  <b style={{ fontWeight: 600 }}>{a.actor.name}</b> {actionText[a.action] ?? a.action} {a.detail}
                  {orgName(a.orgId) ? <small>{orgName(a.orgId)}</small> : null}
                </div>
                <span className="pt-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDateTime(a.at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
