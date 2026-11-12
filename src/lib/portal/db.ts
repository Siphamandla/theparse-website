import "server-only";
import { ObjectId, type Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { DB_NAME } from "./config";

/* ------------------------------------------------------------------ types */

/** Auth.js stores users here; `role` is ours. Staff are also recognised via PORTAL_ADMIN_EMAILS. */
export type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  role?: "admin";
  createdAt?: Date;
};

export type OrgStatus = "needs_review" | "active" | "archived";

export type OrganizationDoc = {
  _id: ObjectId;
  name: string;
  /** Company registration number (e.g. CIPC 2019/123456/07). */
  regNumber?: string;
  phone?: string;
  status: OrgStatus;
  createdAt: Date;
  reviewedAt?: Date;
  invitedBy?: { userId: ObjectId; name: string };
};

export type MemberRole = "owner" | "admin" | "member";

export type MembershipDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  userId: ObjectId;
  role: MemberRole;
  createdAt: Date;
};

/** "expired" is never stored: a pending invite past expiresAt is expired. */
export type InviteStatus = "pending" | "accepted" | "revoked" | "rerequested";

export type InviteDoc = {
  _id: ObjectId;
  type: "client" | "team";
  email: string;
  tokenHash: string;
  expiresAt: Date;
  status: InviteStatus;
  createdAt: Date;
  lastSentAt: Date;
  invitedBy: { userId?: ObjectId; name: string; staff: boolean };
  /** Client invites: optional details the admin already knows. */
  prefill?: { name?: string; company?: string; regNumber?: string; services?: string[] };
  note?: string;
  existingClient?: boolean;
  /** Team invites: the organisation and role they join with. */
  orgId?: ObjectId;
  role?: MemberRole;
  name?: string;
  acceptedAt?: Date;
  rerequestedAt?: Date;
  leadId?: ObjectId;
};

export type Attachment = { key: string; name: string; size: number; type: string };

export type OnboardingSubmissionDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  userId: ObjectId;
  inviteId: ObjectId;
  name: string;
  email: string;
  company: string;
  regNumber?: string;
  phone?: string;
  services: string[];
  message: string;
  attachments: Attachment[];
  createdAt: Date;
};

export type OrgNoteDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  author: { userId: ObjectId; name: string };
  text: string;
  createdAt: Date;
};

/** A file theParse staff attached to a client. Shared files show in the client's portal. */
export type DocumentDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  key: string;
  name: string;
  size: number;
  type: string;
  sharedWithClient: boolean;
  uploadedBy: { userId: ObjectId; name: string; staff: boolean };
  createdAt: Date;
  /** Files behind a contract or invoice. Absent = a general document (Documents tab). */
  category?: "contract" | "invoice";
};

/** Who did something: a staff member or a client user. */
export type Actor = { userId: ObjectId; name: string; staff: boolean };

export type ContractStatus = "awaiting_signature" | "signed" | "void";

/** A contract sent to a client. Files live in `org_documents` (category "contract"). */
export type ContractDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  title: string;
  note?: string;
  status: ContractStatus;
  fileKey: string;
  fileName: string;
  /** The signed copy, uploaded by the client or by staff. */
  signedFileKey?: string;
  signedFileName?: string;
  signedAt?: Date;
  signedBy?: Actor;
  /** Evidence when a client accepted it in the portal (click-to-accept). */
  acceptance?: {
    typedName: string;
    email: string;
    ip?: string;
    userAgent?: string;
    /** SHA-256 of the exact file they accepted. */
    fileSha256?: string;
  };
  sentAt: Date;
  createdBy: Actor;
};

export type PaymentMethod = "eft" | "card" | "cash" | "other";

/** A payment recorded against an invoice (partial payments allowed). */
export type Payment = {
  id: string;
  amountCents: number;
  paidAt: Date;
  method: PaymentMethod;
  reference?: string;
  recordedBy: Actor;
  recordedAt: Date;
};

export type InvoiceStatus = "unpaid" | "paid" | "void";

/** An invoice issued to a client. Overdue is computed (unpaid and past due). */
export type InvoiceDoc = {
  _id: ObjectId;
  orgId: ObjectId;
  number: string;
  /** Amount in cents (ZAR). */
  amountCents: number;
  currency: "ZAR";
  issuedAt: Date;
  dueAt: Date;
  status: InvoiceStatus;
  fileKey?: string;
  fileName?: string;
  /** Optional "Pay now" link (payment provider or accounting system). */
  payUrl?: string;
  /** Date the balance reached zero. */
  paidAt?: Date;
  payments?: Payment[];
  /** The accepted contract this invoice is billed under. */
  contractId?: ObjectId;
  createdBy: Actor;
  createdAt: Date;
};

export type AuditDoc = {
  _id?: ObjectId;
  orgId?: ObjectId;
  actor: { userId?: ObjectId; name: string; staff?: boolean };
  action: string;
  detail?: string;
  at: Date;
};

/** Existing contact form submissions (collection "contacts-us"). */
export type LeadDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  message: string;
  products?: { label: string; value?: string }[];
  status?: "new" | "invited" | "archived";
  createdAt?: Date;
};

/* ------------------------------------------------------------ collections */

export async function db() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function collections() {
  const d = await db();
  return {
    users: d.collection<UserDoc>("users") as Collection<UserDoc>,
    sessions: d.collection("sessions"),
    orgs: d.collection<OrganizationDoc>("organizations"),
    memberships: d.collection<MembershipDoc>("memberships"),
    invites: d.collection<InviteDoc>("invites"),
    submissions: d.collection<OnboardingSubmissionDoc>("onboarding_submissions"),
    notes: d.collection<OrgNoteDoc>("org_notes"),
    documents: d.collection<DocumentDoc>("org_documents"),
    contracts: d.collection<ContractDoc>("org_contracts"),
    invoices: d.collection<InvoiceDoc>("org_invoices"),
    audit: d.collection<AuditDoc>("audit_log"),
    leads: d.collection<LeadDoc>("contacts-us"),
  };
}

let indexesReady: Promise<unknown> | null = null;

/** Creates the indexes the portal relies on (once per server process). */
export function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = (async () => {
      const c = await collections();
      await Promise.all([
        c.invites.createIndex({ tokenHash: 1 }, { unique: true }),
        c.invites.createIndex({ email: 1, status: 1 }),
        c.invites.createIndex({ orgId: 1 }),
        c.memberships.createIndex({ orgId: 1, userId: 1 }, { unique: true }),
        c.memberships.createIndex({ userId: 1 }),
        c.submissions.createIndex({ orgId: 1 }),
        c.submissions.createIndex({ "attachments.key": 1 }),
        c.audit.createIndex({ orgId: 1, at: -1 }),
        c.notes.createIndex({ orgId: 1, createdAt: -1 }),
        c.documents.createIndex({ orgId: 1, createdAt: -1 }),
        c.documents.createIndex({ key: 1 }, { unique: true }),
        c.contracts.createIndex({ orgId: 1, sentAt: -1 }),
        c.invoices.createIndex({ orgId: 1, issuedAt: -1 }),
        c.invoices.createIndex({ number: 1 }),
      ]);
    })().catch((err) => {
      indexesReady = null;
      console.error("❌ [Portal] Index creation failed", err);
    });
  }
  return indexesReady;
}

/** Parses an id from a URL or form; returns null instead of throwing. */
export function toObjectId(id: unknown): ObjectId | null {
  return typeof id === "string" && ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
}
