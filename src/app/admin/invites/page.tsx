import type { Metadata } from "next";
import Link from "next/link";
import type { Filter } from "mongodb";
import ActionButton from "@/components/portal/ActionButton";
import { InviteStatus } from "@/components/portal/StatusPill";
import TableToolbar from "@/components/portal/TableToolbar";
import { collections, type InviteDoc } from "@/lib/portal/db";
import { formatDate, initials, inviteDisplayStatus, relativeDays } from "@/lib/portal/format";
import { INVITE_FILTERS, inviteFilter, isInviteFilter } from "@/lib/portal/invite-filters";
import { resendInviteAction, revokeInviteAction } from "../actions";

export const metadata: Metadata = { title: "Invites" };

const LIMIT = 100;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function InvitesPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = isInviteFilter(searchParams.status) ? searchParams.status : "all";
  const q = (searchParams.q ?? "").trim().slice(0, 80);

  const filter: Filter<InviteDoc> = inviteFilter(status);
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ email: rx }, { name: rx }, { "prefill.name": rx }, { "prefill.company": rx }, { "prefill.regNumber": rx }];
  }

  const c = await collections();
  const [invites, total, counts] = await Promise.all([
    c.invites.find(filter).sort({ lastSentAt: -1 }).limit(LIMIT).toArray(),
    c.invites.countDocuments(filter),
    Promise.all(INVITE_FILTERS.map((f) => c.invites.countDocuments(inviteFilter(f.key)))),
  ]);
  const orgIds = invites.map((i) => i.orgId).filter(Boolean) as NonNullable<InviteDoc["orgId"]>[];
  const orgs = await c.orgs.find({ _id: { $in: orgIds } }).project<{ _id: NonNullable<InviteDoc["orgId"]>; name: string }>({ name: 1 }).toArray();

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Invites</h1>
          <p className="pt-sub">Portal invitations sent by theParse and by clients adding their team.</p>
        </div>
        <Link className="pt-btn sm" href="/admin/invites/new">+ Invite a client</Link>
      </div>

      <section className="pt-dt">
        <TableToolbar
          basePath="/admin/invites"
          label="Filter invites"
          tabs={INVITE_FILTERS.map((f, n) => ({ key: f.key, label: f.label, count: counts[n], hot: f.key === "rerequested" }))}
          current={status}
          defaultKey="all"
          q={q}
          searchLabel="Search name, company, reg. number or email"
        />

        {invites.length === 0 ? (
          <div className="pt-dt-empty">
            {q ? <>No invites match “{q}”.</> : status === "all" ? "No invites yet." : "Nothing here right now."}
          </div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr>
                  <th>Invitee</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Sent</th>
                  <th><span className="pt-sr">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => {
                  const s = inviteDisplayStatus(i);
                  const org = i.orgId ? orgs.find((o) => o._id.equals(i.orgId!)) : null;
                  const title = i.name || i.prefill?.name || org?.name || i.prefill?.company || i.email;
                  const open = s === "pending" || s === "expired" || s === "rerequested";
                  const soon = s === "pending" && i.expiresAt.getTime() - Date.now() < 2 * 86_400_000;
                  const who = (
                    <>
                      <span className="pt-dt-av" aria-hidden="true">{initials(title)}</span>
                      <div>
                        <b>{title}</b>
                        <span>{i.email}</span>
                      </div>
                    </>
                  );
                  return (
                    <tr key={i._id.toString()}>
                      <td>
                        {org ? (
                          <Link className="pt-dt-who" href={`/admin/clients/${org._id.toString()}`}>{who}</Link>
                        ) : (
                          <div className="pt-dt-who">{who}</div>
                        )}
                      </td>
                      <td className="pt-dt-muted" data-label="Type">
                        {i.type === "team" ? `Team · ${org?.name ?? "client"}` : i.existingClient ? "Existing client" : "New client"}
                        {i.type === "client" && i.prefill?.regNumber ? <div className="pt-dt-sub">Reg. {i.prefill.regNumber}</div> : null}
                      </td>
                      <td data-label="Status"><InviteStatus status={s} /></td>
                      <td className={soon ? "pt-dt-warn" : "pt-dt-muted"} data-label="Expires">
                        {open ? relativeDays(i.expiresAt) : "—"}
                      </td>
                      <td className="pt-dt-muted" data-label="Sent">{formatDate(i.lastSentAt)}</td>
                      <td>
                        {open ? (
                          <div className="pt-dt-act">
                            <ActionButton
                              action={resendInviteAction}
                              id={i._id.toString()}
                              label={s === "pending" ? "Resend" : "Send new link"}
                              className={s === "rerequested" ? "pt-dt-btn primary" : "pt-dt-btn"}
                            />
                            {s !== "expired" ? (
                              <ActionButton
                                action={revokeInviteAction}
                                id={i._id.toString()}
                                label="Revoke"
                                className="pt-dt-btn quiet"
                                confirm="Revoke this invite? The link will stop working."
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 ? (
          <div className="pt-dt-foot">
            {total > LIMIT ? `Showing the latest ${LIMIT} of ${total} invites` : `${total} ${total === 1 ? "invite" : "invites"}`}
          </div>
        ) : null}
      </section>
    </>
  );
}
