import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, upsertClient, deleteClient } from "@/lib/api/clients.functions";

// -------------------------------------------------------------------------
// Types (unchanged — consumed by components)
// -------------------------------------------------------------------------
export type AccountType = "corrente" | "poupanca";
export type ClientKind = "cliente" | "indicador";

export type Client = {
  id: string;
  userId: string;
  name: string;
  kind: ClientKind;
  email?: string | null;
  phone?: string | null;

  // Dados pessoais
  cpf?: string | null;
  birthDate?: string | null;
  motherName?: string | null;
  rg?: string | null;
  rgIssueDate?: string | null;
  rgIssueState?: string | null;

  // Endereço
  zip?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;

  // Bancário
  bank?: string | null;
  accountType?: AccountType | string | null;
  agency?: string | null;
  account?: string | null;

  // Financeiro
  totalValue: number;
  percentage: number;
  referrerId?: string | null;

  // Documentos (base64)
  docFront?: string | null;
  docBack?: string | null;

  notes?: string | null;
  createdAt: number;
};

// -------------------------------------------------------------------------
// Query key
// -------------------------------------------------------------------------
const CLIENTS_KEY = ["clients"] as const;

// -------------------------------------------------------------------------
// Hook — drop-in replacement for the old localStorage-based useClients()
// -------------------------------------------------------------------------
export function useClients() {
  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: () => getClients(),
  });

  const upsertMutation = useMutation({
    mutationFn: (c: Client) =>
      upsertClient({
        data: {
          ...c,
          email: c.email ?? null,
          phone: c.phone ?? null,
          cpf: c.cpf ?? null,
          birthDate: c.birthDate ?? null,
          motherName: c.motherName ?? null,
          rg: c.rg ?? null,
          rgIssueDate: c.rgIssueDate ?? null,
          rgIssueState: c.rgIssueState ?? null,
          zip: c.zip ?? null,
          street: c.street ?? null,
          number: c.number ?? null,
          complement: c.complement ?? null,
          district: c.district ?? null,
          city: c.city ?? null,
          state: c.state ?? null,
          bank: c.bank ?? null,
          accountType: c.accountType ?? null,
          agency: c.agency ?? null,
          account: c.account ?? null,
          referrerId: c.referrerId ?? null,
          docFront: c.docFront ?? null,
          docBack: c.docBack ?? null,
          notes: c.notes ?? null,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClient({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });

  const upsert = useCallback((c: Client) => upsertMutation.mutate(c), [upsertMutation]);

  const remove = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);

  return { clients: clients as Client[], upsert, remove };
}

// -------------------------------------------------------------------------
// Utility functions (unchanged)
// -------------------------------------------------------------------------
export function calcClientCommission(c: Client) {
  return ((c.totalValue || 0) * (c.percentage || 0)) / 100;
}

export function calcReferrerCommission(c: Client) {
  if (!c.referrerId) return 0;
  return ((c.totalValue || 0) * (c.percentage || 0)) / 100;
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
