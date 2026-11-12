import "server-only";
import type { ObjectId } from "mongodb";
import { ALLOWED_ATTACHMENT_TYPES, MAX_DOCUMENT_BYTES } from "./config";
import { collections, type Actor, type DocumentDoc } from "./db";
import { headObject } from "./storage";

/** Where uploads for a client go in R2. General documents keep the original flat layout. */
export function orgFolder(orgId: ObjectId, category?: DocumentDoc["category"]) {
  return `orgs/${orgId.toString()}/${category === "contract" ? "contracts/" : category === "invoice" ? "invoices/" : ""}`;
}

/**
 * Records a file the browser has just uploaded straight to R2: checks it belongs in this
 * client's folder, that it really arrived, and its size/type, then saves it in `org_documents`.
 * Returns the stored record, or an error message.
 */
export async function recordUpload(input: {
  orgId: ObjectId;
  key: string;
  name: string;
  category?: DocumentDoc["category"];
  sharedWithClient: boolean;
  by: Actor;
}): Promise<{ doc: DocumentDoc } | { error: string }> {
  const folder = orgFolder(input.orgId, input.category);
  const rest = input.key.slice(folder.length);
  if (!input.key.startsWith(folder) || !rest || rest.includes("/")) return { error: "Upload not recognised." };

  const stored = await headObject(input.key);
  if (!stored || stored.size <= 0 || stored.size > MAX_DOCUMENT_BYTES || !ALLOWED_ATTACHMENT_TYPES[stored.type]) {
    return { error: "The upload didn't complete. Try again." };
  }
  const name = input.name.trim().slice(0, 160) || rest;
  const c = await collections();
  await c.documents.updateOne(
    { key: input.key },
    {
      $setOnInsert: {
        orgId: input.orgId,
        key: input.key,
        name,
        size: stored.size,
        type: stored.type,
        sharedWithClient: input.sharedWithClient,
        uploadedBy: input.by,
        createdAt: new Date(),
        ...(input.category ? { category: input.category } : {}),
      },
    },
    { upsert: true },
  );
  const doc = await c.documents.findOne({ key: input.key });
  return doc ? { doc } : { error: "Couldn't save the file." };
}

/** Only general documents (not contract/invoice files) belong in Documents lists. */
export const generalDocs = { category: { $exists: false } } as const;
