import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;

const globalForMongo = globalThis as unknown as {
  mongoClientPromise: Promise<MongoClient> | undefined;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo.mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;