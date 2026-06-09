import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Shield,
  User,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getUsers, createUser, deleteUser } from "@/lib/api/users.functions";
import type { AuthUser } from "@/router";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    const user = (context as any).user as AuthUser | null;
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Гури — Gerenciar Usuários" },
      { name: "description", content: "Gerencie os usuários do sistema." },
    ],
  }),
  component: AdminUsersPage,
});

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: number;
  clientCount: number;
};

function AdminUsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "user" as "admin" | "user",
  });
  const [creating, setCreating] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário removido");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao remover"),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.name) {
      toast.error("Preencha todos os campos");
      return;
    }
    setCreating(true);
    try {
      await createUser({ data: form });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso");
      setOpen(false);
      setForm({ username: "", password: "", name: "", role: "user" });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Toaster theme="dark" richColors position="top-right" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie quem pode acessar o sistema
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="size-4" /> Novo usuário
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-16 text-center">
            <div
              className="mx-auto size-12 rounded-xl grid place-items-center mb-4"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Users className="size-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold tracking-tight">Nenhum usuário</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crie o primeiro usuário para começar.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {(users as UserRow[]).map((u) => (
              <li
                key={u.id}
                className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/40"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="size-11 rounded-xl grid place-items-center text-sm font-semibold shrink-0 border border-border/70"
                      style={{ background: "var(--gradient-surface)" }}
                    >
                      {u.role === "admin" ? (
                        <Shield className="size-4 text-primary" />
                      ) : (
                        <User className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold tracking-tight">{u.name}</h3>
                        <Badge
                          className={`text-[10px] ${
                            u.role === "admin"
                              ? "bg-primary/15 text-primary border-primary/20"
                              : "bg-accent"
                          }`}
                          variant="secondary"
                        >
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        @{u.username} · {u.clientCount} cliente{u.clientCount !== 1 ? "s" : ""} ·
                        criado em{" "}
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (confirm(`Remover usuário ${u.name}?`))
                        deleteMut.mutate(u.id);
                    }}
                    title="Excluir usuário"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Create user dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie uma conta para que outra pessoa acesse o sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: João Silva"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome de usuário</Label>
              <Input
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, "") }))
                }
                placeholder="Ex: joao"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Senha</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 4 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as "admin" | "user" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
