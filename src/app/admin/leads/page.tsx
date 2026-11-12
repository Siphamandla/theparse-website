import type { Metadata } from "next";
import Link from "next/link";
import type { Filter } from "mongodb";
import ActionButton from "@/components/portal/ActionButton";
import TableToolbar from "@/components/portal/TableToolbar";
import { collections, type LeadDoc } from "@/lib/portal/db";
import { formatDateTime } from "@/lib/portal/format";
import { archiveLead } from "../actions";

export const metadata: Metadata = { title: "Leads" };

const tabs = [
  { key: "new", label: "New" },
  { key: "invited", label: "Invited" },
  { key: "archived", label: "Archived" },
] as const;

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = tabs.some((t) => t.key === searchParams.status) ? searchParams.status! : "new";
  const filter: Filter<LeadDoc> = status === "new" ? { status: { $nin: ["invited", "archived"] } } : { status: status as LeadDoc["status"] };
  const c = await collections();
  const [leads, counts] = await Promise.all([
    c.leads.find(filter).sort({ _id: -1 }).limit(100).toArray(),
    Promise.all([
      c.leads.countDocuments({ status: { $nin: ["invited", "archived"] } }),
      c.leads.countDocuments({ status: "invited" }),
      c.leads.countDocuments({ status: "archived" }),
    ]),
  ]);

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Leads</h1>
          <p className="pt-sub">Enquiries from the website contact form. Send an invite when you&apos;re ready to bring someone into the portal.</p>
        </div>
      </div>

      <section className="pt-dt">
        <TableToolbar
          basePath="/admin/leads"
          label="Filter leads"
          tabs={tabs.map((t, n) => ({ key: t.key, label: t.label, count: counts[n], hot: t.key === "new" }))}
          current={status}
          defaultKey="new"
        />
      </section>

      <div className="pt-stack" style={{ gap: 14 }}>
        {leads.length === 0 ? <div className="pt-empty">Nothing here.</div> : null}
        {leads.map((l) => (
          <article key={l._id.toString()} className="pt-card" style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
            <div style={{ flex: "999 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="pt-row" style={{ alignItems: "baseline" }}>
                <h2 className="pt-h2">{l.name}</h2>
                <span className="pt-muted" style={{ fontSize: 13 }}>{l.email} · {formatDateTime(l.createdAt ?? l._id.getTimestamp())}</span>
              </div>
              {l.products?.length ? (
                <div className="pt-chips">{l.products.map((p) => <span key={p.label} className="pt-chip">{p.label}</span>)}</div>
              ) : null}
              <p className="pt-quote">{l.message}</p>
            </div>
            <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 8 }}>
              {status !== "invited" ? <Link className="pt-btn sm" href={`/admin/invites/new?lead=${l._id.toString()}`}>Send invite</Link> : null}
              <a className="pt-ghost" href={`mailto:${encodeURIComponent(l.email)}`}>Reply by email</a>
              {status !== "archived" ? (
                <div style={{ textAlign: "center" }}>
                  <ActionButton action={archiveLead} id={l._id.toString()} label="Archive" className="pt-textbtn muted" />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
