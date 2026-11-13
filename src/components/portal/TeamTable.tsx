import type { ObjectId } from "mongodb";
import type { ActionResult } from "@/lib/portal/action-result";
import { collections } from "@/lib/portal/db";
import { formatDate, inviteDisplayStatus, roleLabel } from "@/lib/portal/format";
import ActionButton from "./ActionButton";
import RoleSelect from "./RoleSelect";
import { InvitePill } from "./StatusPill";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/** Members and team invites of one organisation, with whichever actions the viewer may use. */
export default async function TeamTable({
  orgId,
  selfMembershipId,
  actions,
}: {
  orgId: ObjectId;
  selfMembershipId?: ObjectId;
  actions: { changeRole?: Action; remove?: Action; resend?: Action; revoke?: Action };
}) {
  const c = await collections();
  const [members, invites] = await Promise.all([
    c.memberships.find({ orgId }).sort({ createdAt: 1 }).toArray(),
    c.invites.find({ orgId, type: "team", status: { $ne: "accepted" } }).sort({ createdAt: -1 }).limit(30).toArray(),
  ]);
  const users = await c.users.find({ _id: { $in: members.map((m) => m.userId) } }).toArray();

  return (
    <div className="pt-table-card">
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Status</th>
              <th>Added</th>
              <th><span className="pt-sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const u = users.find((x) => x._id.equals(m.userId));
              const self = selfMembershipId?.equals(m._id);
              const editable = m.role !== "owner" && !self;
              return (
                <tr key={m._id.toString()}>
                  <td>
                    {u?.name || u?.email}
                    {self ? <span className="pt-muted"> (you)</span> : null}
                    <small>{u?.email}</small>
                  </td>
                  <td>
                    {editable && actions.changeRole && m.role !== "owner" ? (
                      <RoleSelect action={actions.changeRole} id={m._id.toString()} role={m.role} />
                    ) : (
                      roleLabel[m.role]
                    )}
                  </td>
                  <td><span className="pt-pill ok">Active</span></td>
                  <td className="pt-muted">{formatDate(m.createdAt)}</td>
                  <td className="actions">
                    {editable && actions.remove ? (
                      <ActionButton action={actions.remove} id={m._id.toString()} label="Remove" className="pt-textbtn muted" confirm={`Remove ${u?.email} from the portal?`} />
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {invites.map((i) => {
              const status = inviteDisplayStatus(i);
              const live = status === "pending" || status === "expired" || status === "rerequested";
              return (
                <tr key={i._id.toString()}>
                  <td>
                    {i.name || "Invited"}
                    <small>{i.email}</small>
                  </td>
                  <td>{roleLabel[i.role ?? "member"]}</td>
                  <td><InvitePill status={status} /></td>
                  <td className="pt-muted">{formatDate(i.createdAt)}</td>
                  <td className="actions">
                    {live && actions.resend ? (
                      <ActionButton action={actions.resend} id={i._id.toString()} label={status === "pending" ? "Resend" : "Send new link"} />
                    ) : null}
                    {(status === "pending" || status === "rerequested") && actions.revoke ? (
                      <ActionButton action={actions.revoke} id={i._id.toString()} label="Revoke" className="pt-textbtn muted" />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
