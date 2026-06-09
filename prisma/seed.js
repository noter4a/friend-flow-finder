import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

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

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("✅ Admin já existe, pulando seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  console.log("✅ Admin criado com sucesso! (admin / admin123)");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
