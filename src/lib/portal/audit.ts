import "server-only";
import type { ObjectId } from "mongodb";
import { collections, type AuditDoc } from "./db";

/** Records who did what. Failures are logged, never thrown, so they can't break the action. */
export async function audit(entry: { orgId?: ObjectId; actor: AuditDoc["actor"]; action: string; detail?: string }) {
  try {
    const c = await collections();
    await c.audit.insertOne({ ...entry, at: new Date() });
  } catch (err) {
    console.error("❌ [Portal] Audit write failed", err);
  }
}
