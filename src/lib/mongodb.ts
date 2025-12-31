import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; // Ensure this is set in your .env.local file

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In development mode, use a global variable to store the MongoClient promise
// to avoid creating multiple instances during hot-reloading.
if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production, it's fine to create a new client for each request
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;