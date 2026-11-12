import "server-only";
import { createHash, randomBytes } from "crypto";

/** A URL-safe random token. Only its hash is ever stored. */
export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
