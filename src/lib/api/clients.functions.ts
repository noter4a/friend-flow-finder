import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../db.server";
import { requireAuth } from "../auth.server";

// ---------------------------------------------------------------------------
// GET all clients (admin sees all, user sees own)
// ---------------------------------------------------------------------------
export const getClients = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireAuth();

  const where = user.role === "admin" ? {} : { userId: user.id };

  const rows = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    ...r,
    totalValue: r.totalValue ?? 0,
    percentage: r.percentage ?? 0,
    createdAt: r.createdAt.getTime(),
  }));
});

// ---------------------------------------------------------------------------
// Upsert (create or update) a client
// ---------------------------------------------------------------------------
const clientInput = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  rgIssueDate: z.string().optional().nullable(),
  rgIssueState: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
  accountType: z.string().optional().nullable(),
  agency: z.string().optional().nullable(),
  account: z.string().optional().nullable(),
  totalValue: z.number(),
  percentage: z.number(),
  referrerId: z.string().optional().nullable(),
  docFront: z.string().optional().nullable(),
  docBack: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.number(),
});

export const upsertClient = createServerFn({ method: "POST" })
  .validator(clientInput)
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const { createdAt, ...rest } = data;

    // Convert optional empty strings to null for cleaner DB storage
    const cleaned = Object.fromEntries(
      Object.entries(rest).map(([k, v]) => [k, v === "" ? null : v]),
    ) as typeof rest;

    // Check ownership on update (non-admin can only edit own clients)
    const existing = await prisma.client.findUnique({ where: { id: data.id } });
    if (existing && existing.userId !== user.id && user.role !== "admin") {
      throw new Error("Sem permissão para editar este cliente");
    }

    await prisma.client.upsert({
      where: { id: data.id },
      update: {
        ...cleaned,
        createdAt: new Date(createdAt),
      },
      create: {
        ...cleaned,
        userId: user.id,
        createdAt: new Date(createdAt),
      },
    });

    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Delete a client
// ---------------------------------------------------------------------------
export const deleteClient = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await requireAuth();

    // Check ownership (non-admin can only delete own clients)
    const client = await prisma.client.findUnique({ where: { id: data.id } });
    if (!client) throw new Error("Cliente não encontrado");
    if (client.userId !== user.id && user.role !== "admin") {
      throw new Error("Sem permissão para excluir este cliente");
    }

    // Remove any referrer links pointing to this client
    await prisma.client.updateMany({
      where: { referrerId: data.id },
      data: { referrerId: null },
    });

    await prisma.client.delete({
      where: { id: data.id },
    });

    return { ok: true };
  });
