/**
 * Starts a local MongoDB without Docker (downloads a mongod binary on first run via
 * mongodb-memory-server). Data persists in ./.mongo-data so chat history survives restarts.
 *
 *   npm run mongo:local        → mongodb://127.0.0.1:27018
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs";
import path from "node:path";

const port = Number(process.env.MONGO_LOCAL_PORT ?? 27018);
const dbPath = path.resolve(process.cwd(), ".mongo-data");
fs.mkdirSync(dbPath, { recursive: true });

async function main() {
  const server = await MongoMemoryServer.create({
    instance: { port, dbPath, storageEngine: "wiredTiger", ip: "127.0.0.1" },
  });
  console.log(`MongoDB ready at ${server.getUri()}  (data: ${dbPath})`);
  console.log(`Set MONGODB_URI="mongodb://127.0.0.1:${port}" in .env. Press Ctrl+C to stop.`);
  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
