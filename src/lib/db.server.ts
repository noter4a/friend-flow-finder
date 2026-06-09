import { PrismaClient } from "@prisma/client";

// Singleton pattern — reuses the same PrismaClient instance across hot-reloads
// in development and across requests in production.
// The .server.ts suffix ensures this file is NEVER bundled into the client.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
