import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';

// MongoDB Connection State
let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnectedToMongo = false;
let connectionError: string | null = null;

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'voice_expense_tracker';

// Persistent Local Directory for Resilient Fallback (if MONGODB_URI is not set or network fails)
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'MongoDB' | 'MongoDB (Local Fallback Store)';
  uriConfigured: boolean;
  databaseName: string;
  error?: string | null;
  counts: {
    expenses: number;
    budgets: number;
    users: number;
  };
}

/**
 * Initialize MongoDB Connection with resilience
 */
export async function connectToDatabase(forceRetry = false): Promise<Db | null> {
  if (dbInstance && isConnectedToMongo && !forceRetry) {
    return dbInstance;
  }

  const currentUri = process.env.MONGODB_URI || MONGODB_URI;
  if (currentUri) {
    try {
      console.log(`Connecting to MongoDB at: ${currentUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}...`);
      if (client) {
        try { await client.close(); } catch {}
      }
      client = new MongoClient(currentUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      dbInstance = client.db(DB_NAME);
      isConnectedToMongo = true;
      connectionError = null;
      console.log(`✅ Successfully connected to MongoDB database: "${DB_NAME}"`);
      return dbInstance;
    } catch (err: any) {
      connectionError = err?.message || 'Failed to connect to MongoDB';
      console.warn(`⚠️ MongoDB connection warning: ${connectionError}. Using resilient local MongoDB-compatible storage layer.`);
      isConnectedToMongo = false;
      dbInstance = null;
    }
  } else {
    console.log(`ℹ️ MONGODB_URI not detected in environment. Using resilient local MongoDB-compatible layer.`);
  }

  return null;
}

export function isMongoConnected(): boolean {
  return isConnectedToMongo;
}

export function getMongoDb(): Db | null {
  return dbInstance;
}

export function getMongoDbStatus(): {
  connected: boolean;
  uriConfigured: boolean;
  dbName: string;
  error: string | null;
} {
  return {
    connected: isConnectedToMongo,
    uriConfigured: Boolean(MONGODB_URI),
    dbName: DB_NAME,
    error: connectionError,
  };
}
