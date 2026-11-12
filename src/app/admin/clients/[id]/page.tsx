import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/portal/db";
import { formatDate, formatDateTime, roleLabel, serviceLabel } from "@/lib/portal/format";
import { getClient } from "./data";
import RegNumberField from "./RegNumberField";

export const metadata: Metadata = { title: "Client" };

export default async function ClientOverview({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const [submission, owners] = await Promise.all([
    c.submissions.findOne({ orgId: org._id }, { sort: { createdAt: -1 } }),
    c.memberships.find({ orgId: org._id, role: "owner" }).toArray(),
  ]);
  const ownerUsers = await c.users.find({ _id: { $in: owners.map((o) => o.userId) } }).toArray();
  const base = `/admin/clients/${org._id.toString()}`;

  return (
    <div className="pt-grid">
      <section className="pt-card">
        <div className="pt-between">
          <h2 className="pt-h2">Onboarding request</h2>
          {submission ? <span className="pt-muted" style={{ fontSize: 13 }}>Submitted {formatDateTime(submission.createdAt)}</span> : null}
        </div>
        {submission ? (
          <>
            <div>
              <div className="pt-k" style={{ marginBottom: 8 }}>Services requested</div>
              <div className="pt-chips">{submission.services.map((s) => <span key={s} className="pt-chip">{serviceLabel(s)}</span>)}</div>
            </div>
            <div>
              <div className="pt-k" style={{ marginBottom: 8 }}>Message</div>
              <p className="pt-quote">{submission.message}</p>
            </div>
            {submission.attachments.length ? (
              <Link className="pt-link" href={`${base}/documents`}>
                {submission.attachments.length} attachment{submission.attachments.length === 1 ? "" : "s"} · view in Documents →
              </Link>
            ) : null}
          </>
        ) : (
          <div className="pt-empty">No onboarding request on file.</div>
        )}
      </section>

      <section className="pt-card">
        <h2 className="pt-h2">Contact</h2>
        <div className="pt-kv">
          {submission ? (
            <>
              <div><div className="pt-k">Contact</div>{submission.name}</div>
              <div><div className="pt-k">Email</div><a className="pt-link" href={`mailto:${submission.email}`}>{submission.email}</a></div>
              <div><div className="pt-k">Company</div>{submission.company}</div>
              <div><div className="pt-k">Phone</div>{submission.phone || <span className="pt-muted">Not given</span>}</div>
            </>
          ) : null}
          {ownerUsers.map((u) => (
            <div key={u._id.toString()}>
              <div className="pt-k">{roleLabel.owner}</div>
              {u.name || u.email}
              {u.name ? <div className="pt-muted" style={{ fontSize: 13 }}>{u.email}</div> : null}
            </div>
          ))}
          <div><div className="pt-k">Registration no.</div><RegNumberField orgId={org._id.toString()} value={org.regNumber} /></div>
          <div><div className="pt-k">Client since</div>{formatDate(org.createdAt)}</div>
        </div>
      </section>
    </div>
  );
}
