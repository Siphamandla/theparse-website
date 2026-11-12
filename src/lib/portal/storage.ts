import "server-only";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";

/**
 * File storage on Cloudflare R2 through its S3-compatible API.
 * Swapping to AWS S3 (e.g. af-south-1) only needs a different endpoint/region.
 *
 * Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

let client: S3Client | null = null;

export function storageConfigured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
  );
}

function s3() {
  if (!storageConfigured()) throw new Error("File storage is not configured (R2_* env vars)");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const bucket = () => process.env.R2_BUCKET!;

/** A short-lived URL the browser can PUT one file to. Size and type are part of the signature. */
export function presignUpload(key: string, contentType: string, size: number) {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn: 10 * 60 },
  );
}

/**
 * A short-lived download URL. Call only after checking the user may see the file.
 * `inlineType` (a previewable type from PREVIEW_TYPES) asks the browser to display it instead of saving it.
 */
export function presignDownload(key: string, filename: string, inlineType?: string) {
  const safe = filename.replace(/["\\\r\n]/g, "_");
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `${inlineType ? "inline" : "attachment"}; filename="${safe}"`,
      ...(inlineType ? { ResponseContentType: inlineType } : {}),
    }),
    { expiresIn: 5 * 60 },
  );
}

/** Size and type of an uploaded object, or null when it doesn't exist. */
export async function headObject(key: string) {
  try {
    const res = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: res.ContentLength ?? 0, type: res.ContentType ?? "" };
  } catch {
    return null;
  }
}

/** Removes a stored object. Missing objects are not an error. */
export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/** SHA-256 (hex) of a stored object, read in a stream. Used as evidence of exactly which file was accepted. */
export async function sha256Object(key: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const hash = createHash("sha256");
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) hash.update(chunk);
  return hash.digest("hex");
}
