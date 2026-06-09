import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Singleton pattern — reuses the same PrismaClient instance across hot-reloads
// in development and across requests in production.
// The .server.ts suffix ensures this file is NEVER bundled into the client.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const getPrismaInstance = () => {
  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const dbUrl = new URL(connectionUrl);
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "3306"),
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.substring(1),
  });

  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? getPrismaInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
