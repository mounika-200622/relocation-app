import { PrismaClient } from "@prisma/client";
import { ipv4Loopback } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Single PrismaClient per process (hot reload in dev would otherwise open many pools). */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: ipv4Loopback(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
