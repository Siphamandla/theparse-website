import "server-only";
import type { ObjectId } from "mongodb";
import { collections, type ContractDoc, type DocumentDoc, type InvoiceDoc, type ProjectDoc } from "./db";

export type ClientProject = {
  project: ProjectDoc;
  contracts: ContractDoc[];
  /** Empty until one of the project's contracts is accepted (billing starts then). */
  invoices: InvoiceDoc[];
  /** Only files shared with the client. */
  files: DocumentDoc[];
};

/**
 * What a client may see of their projects: shared files, non-cancelled contracts and invoices.
 * Pass `projectId` to load just one project (returns [] if it isn't this client's).
 */
export async function clientProjects(orgId: ObjectId, projectId?: ObjectId): Promise<ClientProject[]> {
  const c = await collections();
  const projects = await c.projects.find({ orgId, ...(projectId ? { _id: projectId } : {}) }).sort({ createdAt: -1 }).toArray();
  if (!projects.length) return [];
  const ids = projects.map((p) => p._id);

  const [contracts, invoices, files] = await Promise.all([
    c.contracts.find({ orgId, projectId: { $in: ids }, status: { $ne: "void" } }).sort({ sentAt: -1 }).toArray(),
    c.invoices.find({ orgId, status: { $ne: "void" } }).sort({ issuedAt: -1, createdAt: -1 }).toArray(),
    c.documents.find({ orgId, sharedWithClient: true, projectId: { $in: ids } }).sort({ createdAt: -1 }).toArray(),
  ]);
  // An invoice's project, falling back to its contract's (invoices made before projects existed).
  const invoiceProject = (i: InvoiceDoc) => i.projectId ?? contracts.find((k) => i.contractId && k._id.equals(i.contractId))?.projectId;

  return projects.map((project) => {
    const own = contracts.filter((k) => k.projectId?.equals(project._id));
    return {
      project,
      contracts: own,
      invoices: own.some((k) => k.status === "signed") ? invoices.filter((i) => invoiceProject(i)?.equals(project._id)) : [],
      files: files.filter((d) => d.projectId?.equals(project._id)),
    };
  });
}

/** "Started 01 Nov 2026 · Due 15 Dec 2026", or null when neither date is set. */
export function projectDates(p: Pick<ProjectDoc, "startDate" | "dueDate">, format: (d: Date) => string) {
  const parts = [p.startDate ? `Started ${format(p.startDate)}` : "", p.dueDate ? `Due ${format(p.dueDate)}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const projectHref = (id: ObjectId | string) => `/portal/projects/${id.toString()}`;
