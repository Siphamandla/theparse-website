import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/portal/db";
import { formatDate, formatTimestamp, projectStatusLabel, projectTone } from "@/lib/portal/format";
import { getClient } from "../data";
import ProjectForm from "./ProjectForm";

export const metadata: Metadata = { title: "Client projects" };

export default async function ClientProjects({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const projects = await c.projects.find({ orgId: org._id }).sort({ createdAt: -1 }).toArray();
  const fileCounts = await c.documents
    .aggregate<{ _id: unknown; n: number }>([{ $match: { projectId: { $in: projects.map((p) => p._id) } } }, { $group: { _id: "$projectId", n: { $sum: 1 } } }])
    .toArray();
  const filesFor = (id: { equals: (o: unknown) => boolean }) => fileCounts.find((f) => id.equals(f._id))?.n ?? 0;
  const base = `/admin/clients/${org._id.toString()}/projects`;

  return (
    <>
      <section className="pt-card">
        <div>
          <h2 className="pt-h2">New project</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {org.name} sees every project on their portal&apos;s Projects page. You can attach documents after it&apos;s created.
          </p>
        </div>
        <ProjectForm orgId={org._id.toString()} />
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Projects</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{projects.length} total</span>
        </div>
        {projects.length === 0 ? (
          <div className="pt-dt-empty">No projects yet.</div>
        ) : (
          <div className="pt-dt-wrap">
            <table className="pt-dt-table">
              <thead>
                <tr><th>Project</th><th>Status</th><th>Dates</th><th>Files</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const files = filesFor(p._id);
                  return (
                    <tr key={p._id.toString()}>
                      <td>
                        <div className="pt-dt-two">
                          <Link className="pt-link" href={`${base}/${p._id.toString()}`}><b>{p.name}</b></Link>
                          {p.description ? <span>{p.description.length > 90 ? `${p.description.slice(0, 90)}…` : p.description}</span> : null}
                        </div>
                      </td>
                      <td data-label="Status"><span className={`pt-status ${projectTone[p.status]}`}>{projectStatusLabel[p.status]}</span></td>
                      <td className="pt-dt-muted" data-label="Dates">
                        {p.startDate || p.dueDate ? `${formatDate(p.startDate)} → ${formatDate(p.dueDate)}` : "—"}
                      </td>
                      <td className="pt-dt-muted" data-label="Files">{files}</td>
                      <td className="pt-dt-muted" data-label="Updated">{formatTimestamp(p.updatedAt)}</td>
                    </tr>
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
