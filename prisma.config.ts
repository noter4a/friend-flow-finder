import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "mysql://guri:guri_secret@localhost:3306/guri",
  },
});
