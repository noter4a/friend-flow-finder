import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Users,
  TrendingUp,
  Wallet,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  useClients,
  calcClientCommission,
  calcReferrerCommission,
  formatBRL,
  type Client,
} from "@/lib/clients-store";
import { ClientDialog } from "@/components/client-dialog";
import { ClientViewDialog } from "@/components/client-view-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Гури — Clientes & Financeiro" },
      {
        name: "description",
        content: "Gerencie clientes, comissões e indicações em um painel moderno.",
      },
    ],
  }),
  component: Index,
});

type FilterKind = "todos" | "cliente" | "indicador";

function Index() {
  const { clients, upsert, remove } = useClients();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [viewing, setViewing] = useState<Client | null>(null);
  const [filter, setFilter] = useState<FilterKind>("todos");

  const counts = useMemo(
    () => ({
      todos: clients.length,
      cliente: clients.filter((c) => (c.kind ?? "cliente") === "cliente").length,
      indicador: clients.filter((c) => c.kind === "indicador").length,
    }),
    [clients],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const kind = c.kind ?? "cliente";
      if (filter !== "todos" && kind !== filter) return false;
      if (!q) return true;
      const cleanCPF = c.cpf ? c.cpf.replace(/\D/g, "") : "";
      const cleanQuery = q.replace(/\D/g, "");
      const matchesCPF = cleanCPF && cleanQuery && cleanCPF.includes(cleanQuery);
      return (
        matchesCPF ||
        [c.name, c.email, c.phone].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
      );
    });
  }, [clients, query, filter]);

  const stats = useMemo(() => {
    const realClients = clients.filter((c) => (c.kind ?? "cliente") === "cliente");
    const totalValue = realClients.reduce((s, c) => s + c.totalValue, 0);
    const totalClientCommission = realClients.reduce((s, c) => s + calcClientCommission(c), 0);
    const totalReferrerCommission = realClients.reduce((s, c) => s + calcReferrerCommission(c), 0);
    return {
      totalValue,
      totalClientCommission,
      totalReferrerCommission,
      withReferrer: realClients.filter((c) => c.referrerId).length,
    };
  }, [clients]);

  const byId = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const referralsOf = useMemo(() => {
    const m = new Map<string, Client[]>();
    clients.forEach((c) => {
      if (c.referrerId) {
        const arr = m.get(c.referrerId) ?? [];
        arr.push(c);
        m.set(c.referrerId, arr);
      }
    });
    return m;
  }, [clients]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" richColors position="top-right" />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="size-9 rounded-xl grid place-items-center"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Гури</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Clientes & comissões</p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="size-4" /> Novo cliente
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Receita total"
            value={formatBRL(stats.totalValue)}
            icon={<Wallet className="size-4" />}
            accent
          />
          <StatCard
            label="Comissão clientes"
            value={formatBRL(stats.totalClientCommission)}
            icon={<TrendingUp className="size-4" />}
          />
          <StatCard
            label="Comissão indicações"
            value={formatBRL(stats.totalReferrerCommission)}
            icon={<Share2 className="size-4" />}
          />
          <StatCard
            label="Clientes / indicados"
            value={`${clients.length} / ${stats.withReferrer}`}
            icon={<Users className="size-4" />}
          />
        </section>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-surface border border-border/70">
            <FilterTab
              active={filter === "todos"}
              onClick={() => setFilter("todos")}
              label="Todos"
              count={counts.todos}
            />
            <FilterTab
              active={filter === "cliente"}
              onClick={() => setFilter("cliente")}
              label="Clientes"
              count={counts.cliente}
            />
            <FilterTab
              active={filter === "indicador"}
              onClick={() => setFilter("indicador")}
              label="Indicadores"
              count={counts.indicador}
            />
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 bg-surface border-border"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <EmptyState onCreate={openNew} hasClients={clients.length > 0} />
        ) : (
          <ul className="grid gap-3">
            {filtered.map((c) => {
              const isReferrer = c.kind === "indicador";
              const referrer = c.referrerId ? byId.get(c.referrerId) : null;
              const indicated = referralsOf.get(c.id) ?? [];
              const clientComm = calcClientCommission(c);
              const refComm = calcReferrerCommission(c);
              return (
                <li
                  key={c.id}
                  className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/40"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <Avatar name={c.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold tracking-tight truncate">{c.name}</h3>
                          {isReferrer ? (
                            <Badge className="text-[10px] gap-1 bg-warning/15 text-warning border-warning/20 hover:bg-warning/20">
                              <Share2 className="size-3" /> Indicador
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-accent">
                              <Users className="size-3" /> Cliente
                            </Badge>
                          )}
                          {referrer && (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-accent">
                              <Share2 className="size-3" /> indicado por {referrer.name}
                            </Badge>
                          )}
                          {indicated.length > 0 && (
                            <Badge className="text-[10px] gap-1 bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
                              <Users className="size-3" /> {indicated.length} indicação
                              {indicated.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[c.email, c.phone].filter(Boolean).join(" · ") || "Sem contato"}
                        </p>

                        {!isReferrer && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Metric label="Valor total" value={formatBRL(c.totalValue)} />
                            <Metric
                              label={`Comissão (${c.percentage}%)`}
                              value={formatBRL(clientComm)}
                              tone="success"
                            />
                            {referrer ? (
                              <Metric
                                label="Comissão indicador"
                                value={formatBRL(refComm)}
                                tone="primary"
                              />
                            ) : (
                              <Metric label="Indicação" value="—" />
                            )}
                            <Metric
                              label="Líquido"
                              value={formatBRL(c.totalValue - clientComm - refComm)}
                            />
                          </div>
                        )}

                        {isReferrer && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Metric
                              label="Indicações"
                              value={String(indicated.length)}
                              tone="primary"
                            />
                            <Metric
                              label="Comissão gerada"
                              value={formatBRL(
                                indicated.reduce((s, i) => s + calcReferrerCommission(i), 0),
                              )}
                              tone="success"
                            />
                          </div>
                        )}

                        {indicated.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/60">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                              Indicações
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {indicated.map((i) => (
                                <span
                                  key={i.id}
                                  className="text-xs px-2.5 py-1 rounded-md bg-surface border border-border/70"
                                >
                                  {i.name}{" "}
                                  <span className="text-muted-foreground">
                                    · {formatBRL(calcReferrerCommission(i))}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setViewing(c)}
                        title="Ver detalhes"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-60 group-hover:opacity-100"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Remover ${c.name}?`)) remove(c.id);
                            }}
                          >
                            <Trash2 className="size-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <ClientDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        clients={clients}
        onSave={upsert}
      />
      <ClientViewDialog
        open={!!viewing}
        onOpenChange={(v) => {
          if (!v) setViewing(null);
        }}
        client={viewing}
        clients={clients}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border border-border/70 p-5 relative overflow-hidden"
      style={{
        background: accent ? "var(--gradient-surface)" : "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {accent && (
        <div
          className="absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <div className="flex items-center justify-between text-muted-foreground relative">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="size-7 grid place-items-center rounded-lg bg-surface border border-border/70">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight relative">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "primary";
}) {
  const color =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="size-11 rounded-xl grid place-items-center text-sm font-semibold shrink-0 border border-border/70"
      style={{ background: "var(--gradient-surface)" }}
    >
      {initials || "?"}
    </div>
  );
}

function EmptyState({ onCreate, hasClients }: { onCreate: () => void; hasClients: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 p-16 text-center">
      <div
        className="mx-auto size-12 rounded-xl grid place-items-center mb-4"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <Users className="size-5 text-primary-foreground" />
      </div>
      <h3 className="font-semibold tracking-tight">
        {hasClients ? "Nenhum resultado" : "Comece adicionando seu primeiro cliente"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {hasClients
          ? "Ajuste a busca para encontrar o cliente desejado."
          : "Cadastre clientes, defina uma porcentagem sobre o valor total e vincule indicações para acompanhar comissões."}
      </p>
      {!hasClients && (
        <Button onClick={onCreate} className="mt-5 gap-2">
          <Plus className="size-4" /> Novo cliente
        </Button>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
        active
          ? "bg-card text-foreground shadow-sm border border-border/70"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? "bg-primary/15 text-primary" : "bg-surface text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  );
}
