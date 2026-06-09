import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../db.server";
import { requireAdmin, hashPassword } from "../auth.server";

// ---------------------------------------------------------------------------
// GET all users (admin only)
// ---------------------------------------------------------------------------
export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { clients: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.getTime(),
    clientCount: u._count.clients,
  }));
});

// ---------------------------------------------------------------------------
// Create user (admin only)
// ---------------------------------------------------------------------------
const createUserInput = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  name: z.string().min(1),
  role: z.enum(["admin", "user"]),
});

export const createUser = createServerFn({ method: "POST" })
  .validator(createUserInput)
  .handler(async ({ data }) => {
    await requireAdmin();

    const exists = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (exists) {
      throw new Error("Nome de usuário já existe");
    }

    const hashed = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        username: data.username,
        password: hashed,
        name: data.name,
        role: data.role,
      },
    });

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Delete user (admin only, cannot delete self)
// ---------------------------------------------------------------------------
export const deleteUser = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();

    if (data.id === admin.id) {
      throw new Error("Você não pode deletar sua própria conta");
    }

    await prisma.user.delete({ where: { id: data.id } });

    return { ok: true };
  });
