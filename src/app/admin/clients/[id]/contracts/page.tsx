import type { Metadata } from "next";
import Link from "next/link";
import type { ObjectId } from "mongodb";
import { collections } from "@/lib/portal/db";
import { storageConfigured } from "@/lib/portal/storage";
import { getClient } from "../data";
import ContractForm from "./ContractForm";
import ContractsTable from "./ContractsTable";

export const metadata: Metadata = { title: "Client contracts" };

export default async function ClientContracts({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const c = await collections();
  const [contracts, projects] = await Promise.all([
    c.contracts.find({ orgId: org._id }).sort({ sentAt: -1 }).toArray(),
    c.projects.find({ orgId: org._id }).sort({ createdAt: -1 }).project<{ _id: ObjectId; name: string; status: string }>({ name: 1, status: 1 }).toArray(),
  ]);
  const allProjects = projects.map((p) => ({ id: p._id.toString(), name: p.name }));
  // New contracts only go to projects that are still going.
  const openProjects = projects.filter((p) => p.status !== "cancelled" && p.status !== "completed").map((p) => ({ id: p._id.toString(), name: p.name }));
  const base = `/admin/clients/${org._id.toString()}`;

  return (
    <>
      <section className="pt-card">
        <div>
          <h2 className="pt-h2">Send a contract</h2>
          <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Every contract belongs to one of {org.name}&apos;s projects. To sign, they must attach a signed copy, confirm they agree and type their full name in the portal. You&apos;ll get an email when they do, and invoicing opens.
          </p>
        </div>
        {!storageConfigured() ? (
          <div className="pt-empty">File storage isn&apos;t configured yet.</div>
        ) : openProjects.length ? (
          <ContractForm orgId={org._id.toString()} projects={openProjects} />
        ) : (
          <div className="pt-empty">
            {projects.length ? `${org.name} has no open projects. ` : `Create a project for ${org.name} first. `}Contracts are sent per project.{" "}
            <Link className="pt-link" href={`${base}/projects`}>Go to Projects →</Link>
          </div>
        )}
      </section>

      <section className="pt-dt">
        <div className="pt-dt-bar" style={{ padding: "0 20px", minHeight: 52 }}>
          <h2 className="pt-h2">Contracts</h2>
          <span className="pt-muted" style={{ fontSize: 13 }}>{contracts.length} total</span>
        </div>
        <ContractsTable contracts={contracts} projects={allProjects} />
      </section>
    </>
  );
}
