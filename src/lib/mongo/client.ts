import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB holds the document-shaped, append-heavy data:
 *   messages       – chat message bodies (conversation headers are relational, in MySQL)
 *   notifications  – in-app notifications, auto-expired by a TTL index
 * See docs/nosql-design.md for the data model and why it is not in MySQL.
 */
const globalForMongo = globalThis as unknown as { niraMongo?: Promise<Db> };

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Start MongoDB (docker compose up -d, or npm run mongo:local).");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000, appName: "nira" });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "nira");
  await ensureIndexes(db);
  return db;
}

export async function ensureIndexes(db: Db) {
  await Promise.all([
    // newest-first / after-cursor paging inside one conversation
    db.collection("messages").createIndex({ conversationId: 1, _id: 1 }, { name: "conv_id" }),
    // unread counters: only unread rows are indexed (partial index)
    db.collection("messages").createIndex(
      { conversationId: 1, senderId: 1 },
      { name: "unread_by_conv", partialFilterExpression: { readAt: null } },
    ),
    db.collection("messages").createIndex({ sentAt: -1 }, { name: "sent_at" }),
    db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }, { name: "user_recent" }),
    // TTL: notifications disappear 90 days after creation
    db.collection("notifications").createIndex({ createdAt: 1 }, { name: "ttl_90d", expireAfterSeconds: 60 * 60 * 24 * 90 }),
  ]);
}

export function getDb(): Promise<Db> {
  if (!globalForMongo.niraMongo) {
    globalForMongo.niraMongo = connect().catch((err) => {
      globalForMongo.niraMongo = undefined; // retry on the next request
      throw err;
    });
  }
  return globalForMongo.niraMongo;
}
