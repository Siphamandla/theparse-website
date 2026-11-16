import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { db } from "./db";

/**
 * One-time sign-in codes, sent in the same email as the magic link.
 *
 * - 6 digits, valid for 10 minutes, at most 5 wrong guesses, then it's dead.
 * - One live code per address: requesting a new email replaces the old code.
 * - Only an HMAC of the code is stored (keyed with AUTH_SECRET, so a database leak
 *   doesn't let anyone brute-force the 1,000,000 possibilities offline).
 * - Using the code or the link removes both (see consumeSignInCode / auth.ts events).
 */
export const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

type SignInCodeDoc = { email: string; codeHash: string; expiresAt: Date; attempts: number; createdAt: Date };

async function codes() {
  const col = (await db()).collection<SignInCodeDoc>("signin_codes");
  return col;
}

let indexed: Promise<unknown> | null = null;
async function ensureCodeIndexes() {
  if (!indexed) {
    indexed = (async () => {
      const col = await codes();
      await Promise.all([
        col.createIndex({ email: 1 }, { unique: true }),
        // MongoDB deletes expired codes on its own.
        col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    })().catch((err) => {
      indexed = null;
      console.error("❌ [Portal] Sign-in code index creation failed", err);
    });
  }
  return indexed;
}

function hash(email: string, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set to issue sign-in codes");
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

/** Creates (or replaces) the code for this address and returns it for the email. */
export async function issueSignInCode(email: string) {
  await ensureCodeIndexes();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  await (await codes()).updateOne(
    { email },
    { $set: { email, codeHash: hash(email, code), expiresAt: new Date(now.getTime() + CODE_MINUTES * 60_000), attempts: 0, createdAt: now } },
    { upsert: true },
  );
  return code;
}

/**
 * Checks a code. On success the code is deleted (single use) and true is returned.
 * Wrong, expired, unknown and used-up codes all just return false, so the caller
 * can't tell whether an address has an account.
 */
export async function consumeSignInCode(email: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const col = await codes();
  // Count the attempt first (atomically), so parallel guesses can't exceed the limit.
  const doc = await col.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!doc) return false;
  const a = Buffer.from(doc.codeHash, "hex");
  const b = Buffer.from(hash(email, code), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  // Single use: only the request that deletes it wins.
  const { deletedCount } = await col.deleteOne({ _id: doc._id, codeHash: doc.codeHash });
  return deletedCount === 1;
}

/** Removes any live code for this address (e.g. after they signed in with the link). */
export async function clearSignInCode(email: string) {
  await (await codes()).deleteMany({ email });
}
