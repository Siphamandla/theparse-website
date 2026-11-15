import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Returns a connected MongoClient, shared by every request on this server instance
 * (and across hot reloads in development).
 *
 * If connecting fails (e.g. Atlas is unreachable), the failed attempt is discarded so
 * the next call tries again, instead of every later request reusing the same rejection
 * until the server instance is recycled.
 */
export default function getMongoClient(): Promise<MongoClient> {
  if (globalThis._mongoClientPromise) return globalThis._mongoClientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  const client = new MongoClient(uri, {
    appName: 'theparse-website', // identifies these connections in Atlas metrics and logs
    serverSelectionTimeoutMS: 5_000, // fail fast (default is 30s) so requests don't hang when Atlas is unreachable
    maxPoolSize: 10, // default is 100 per instance; many serverless instances could exhaust Atlas's connection limit
    maxIdleTimeMS: 60_000, // close idle connections instead of leaving them open on Atlas
  });
  const promise = client.connect().catch((err) => {
    // Only clear the cache if it still holds this attempt.
    if (globalThis._mongoClientPromise === promise) globalThis._mongoClientPromise = undefined;
    client.close().catch(() => {});
    throw err;
  });
  globalThis._mongoClientPromise = promise;
  return promise;
}
