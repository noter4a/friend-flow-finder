import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Client, type AccountType, type ClientKind, newId } from "@/lib/clients-store";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Landmark,
  Wallet,
  Share2,
  UserCheck,
  Megaphone,
  Loader2,
  Upload,
  X,
  FileImage,
  Eye,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Client | null;
  clients: Client[];
  onSave: (c: Client) => void;
};

const UF = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const empty = {
  kind: "cliente" as ClientKind,
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birthDate: "",
  motherName: "",
  rg: "",
  rgIssueDate: "",
  rgIssueState: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  bank: "",
  accountType: "corrente" as AccountType,
  agency: "",
  account: "",
  totalValue: "0",
  percentage: "10",
  referrerId: "none",
  docFront: "",
  docBack: "",
  notes: "",
};

export function ClientDialog({ open, onOpenChange, initial, clients, onSave }: Props) {
  const [f, setF] = useState(empty);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setF({
        kind: initial.kind ?? "cliente",
        name: initial.name ?? "",
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        cpf: initial.cpf ?? "",
        birthDate: initial.birthDate ?? "",
        motherName: initial.motherName ?? "",
        rg: initial.rg ?? "",
        rgIssueDate: initial.rgIssueDate ?? "",
        rgIssueState: initial.rgIssueState ?? "",
        zip: initial.zip ?? "",
        street: initial.street ?? "",
        number: initial.number ?? "",
        complement: initial.complement ?? "",
        district: initial.district ?? "",
        city: initial.city ?? "",
        state: initial.state ?? "",
        bank: initial.bank ?? "",
        accountType: initial.accountType ?? "corrente",
        agency: initial.agency ?? "",
        account: initial.account ?? "",
        totalValue: String(initial.totalValue ?? 0),
        percentage: String(initial.percentage ?? 10),
        referrerId: initial.referrerId ?? "none",
        docFront: initial.docFront ?? "",
        docBack: initial.docBack ?? "",
        notes: initial.notes ?? "",
      });
    } else {
      setF(empty);
    }
  }, [open, initial]);

  const possibleReferrers = clients.filter((c) => c.id !== initial?.id);
  const [loadingCep, setLoadingCep] = useState(false);
  const [lastFetchedCep, setLastFetchedCep] = useState("");

  const fetchAddress = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setF((p) => ({
        ...p,
        street: data.logradouro || p.street,
        district: data.bairro || p.district,
        city: data.localidade || p.city,
        state: data.uf || p.state,
        complement: data.complemento || p.complement,
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setLastFetchedCep("");
      return;
    }
    if (initial) {
      const cleanInit = (initial.zip ?? "").replace(/\D/g, "");
      setLastFetchedCep(cleanInit);
    }
  }, [open, initial]);

  useEffect(() => {
    const clean = f.zip.replace(/\D/g, "");
    if (clean.length === 8 && clean !== lastFetchedCep) {
      setLastFetchedCep(clean);
      fetchAddress(clean);
    }
  }, [f.zip, lastFetchedCep, fetchAddress]);

  const submit = () => {
    if (!f.name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const c: Client = {
      id: initial?.id ?? newId(),
      kind: f.kind,
      name: f.name.trim(),
      email: f.email.trim() || undefined,
      phone: f.phone.trim() || undefined,
      cpf: f.cpf.trim() || undefined,
      birthDate: f.birthDate || undefined,
      motherName: f.motherName.trim() || undefined,
      rg: f.rg.trim() || undefined,
      rgIssueDate: f.rgIssueDate || undefined,
      rgIssueState: f.rgIssueState || undefined,
      zip: f.zip.trim() || undefined,
      street: f.street.trim() || undefined,
      number: f.number.trim() || undefined,
      complement: f.complement.trim() || undefined,
      district: f.district.trim() || undefined,
      city: f.city.trim() || undefined,
      state: f.state || undefined,
      bank: f.bank.trim() || undefined,
      accountType: f.accountType,
      agency: f.agency.trim() || undefined,
      account: f.account.trim() || undefined,
      totalValue: f.kind === "indicador" ? 0 : Math.max(0, parseFloat(f.totalValue) || 0),
      percentage: f.kind === "indicador" ? 0 : Math.max(0, parseFloat(f.percentage) || 0),
      referrerId: f.kind === "indicador" || f.referrerId === "none" ? null : f.referrerId,
      docFront: f.docFront || undefined,
      docBack: f.docBack || undefined,
      notes: f.notes.trim() || undefined,
      createdAt: initial?.createdAt ?? Date.now(),
    };
    onSave(c);
    toast.success(initial ? "Cliente atualizado" : "Cliente adicionado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <DialogTitle>{initial ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Preencha os dados pessoais, endereço e bancários do cliente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-5 space-y-7">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface border border-border/70">
              <KindOption
                active={f.kind === "cliente"}
                onClick={() => set("kind", "cliente")}
                icon={<UserCheck className="size-4" />}
                label="Cliente"
                desc="Faz o trabalho"
              />
              <KindOption
                active={f.kind === "indicador"}
                onClick={() => set("kind", "indicador")}
                icon={<Megaphone className="size-4" />}
                label="Indicador"
                desc="Apenas indica"
              />
            </div>
            <Section icon={<User className="size-4" />} title="Dados pessoais">
              <Grid>
                <Field label="Nome completo" full>
                  <Input
                    value={f.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                </Field>
                <Field label="CPF">
                  <Input
                    value={f.cpf}
                    onChange={(e) => set("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </Field>
                <Field label="Data de nascimento">
                  <Input
                    type="date"
                    value={f.birthDate}
                    onChange={(e) => set("birthDate", e.target.value)}
                  />
                </Field>
                <Field label="Nome da mãe" full>
                  <Input value={f.motherName} onChange={(e) => set("motherName", e.target.value)} />
                </Field>
                <Field label="RG">
                  <Input value={f.rg} onChange={(e) => set("rg", e.target.value)} />
                </Field>
                <Field label="Data de emissão">
                  <Input
                    type="date"
                    value={f.rgIssueDate}
                    onChange={(e) => set("rgIssueDate", e.target.value)}
                  />
                </Field>
                <Field label="Estado de emissão (UF)">
                  <UFSelect value={f.rgIssueState} onChange={(v) => set("rgIssueState", v)} />
                </Field>
                <Field label="E-mail">
                  <Input value={f.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Telefone">
                  <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
              </Grid>
            </Section>

            <Section icon={<FileImage className="size-4" />} title="Documentos (RG / CNH)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="Frente do documento"
                  value={f.docFront}
                  onChange={(val) => set("docFront", val)}
                  onZoom={(src) => setZoomedImage({ src, title: "Frente do documento" })}
                />
                <DocumentUploadField
                  label="Verso do documento"
                  value={f.docBack}
                  onChange={(val) => set("docBack", val)}
                  onZoom={(src) => setZoomedImage({ src, title: "Verso do documento" })}
                />
              </div>
            </Section>

            <Section icon={<MapPin className="size-4" />} title="Endereço">
              <Grid>
                <Field label="CEP">
                  <div className="relative">
                    <Input
                      value={f.zip}
                      onChange={(e) => set("zip", e.target.value)}
                      placeholder="00000-000"
                    />
                    {loadingCep && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                      </span>
                    )}
                  </div>
                </Field>
                <Field label="Rua" className="col-span-2">
                  <Input value={f.street} onChange={(e) => set("street", e.target.value)} />
                </Field>
                <Field label="Número">
                  <Input value={f.number} onChange={(e) => set("number", e.target.value)} />
                </Field>
                <Field label="Complemento">
                  <Input value={f.complement} onChange={(e) => set("complement", e.target.value)} />
                </Field>
                <Field label="Bairro">
                  <Input value={f.district} onChange={(e) => set("district", e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="Estado (UF)">
                  <UFSelect value={f.state} onChange={(v) => set("state", v)} />
                </Field>
              </Grid>
            </Section>

            <Section icon={<Landmark className="size-4" />} title="Dados bancários">
              <Grid>
                <Field label="Banco" full>
                  <Input
                    value={f.bank}
                    onChange={(e) => set("bank", e.target.value)}
                    placeholder="Ex: Banco do Brasil"
                  />
                </Field>
                <Field label="Tipo de conta">
                  <Select
                    value={f.accountType}
                    onValueChange={(v) => set("accountType", v as AccountType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Agência">
                  <Input value={f.agency} onChange={(e) => set("agency", e.target.value)} />
                </Field>
                <Field label="Conta">
                  <Input value={f.account} onChange={(e) => set("account", e.target.value)} />
                </Field>
              </Grid>
            </Section>

            {f.kind === "cliente" && (
              <>
                <Section icon={<Wallet className="size-4" />} title="Financeiro">
                  <Grid>
                    <Field label="Valor total (R$)">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={f.totalValue}
                        onChange={(e) => set("totalValue", e.target.value)}
                      />
                    </Field>
                    <Field label="% do cliente">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={f.percentage}
                        onChange={(e) => set("percentage", e.target.value)}
                      />
                    </Field>
                  </Grid>
                </Section>

                <Section icon={<Share2 className="size-4" />} title="Indicação">
                  <Grid>
                    <Field label="Indicado por" full>
                      <Select value={f.referrerId} onValueChange={(v) => set("referrerId", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {possibleReferrers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              {c.kind === "indicador" ? " · indicador" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </Grid>
                </Section>
              </>
            )}

            <Section title="Notas">
              <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
            </Section>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog
        open={!!zoomedImage}
        onOpenChange={(open) => {
          if (!open) setZoomedImage(null);
        }}
      >
        <DialogContent className="max-w-3xl p-1 bg-background border-border">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {zoomedImage && (
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span className="size-7 grid place-items-center rounded-md bg-surface border border-border/70 text-muted-foreground">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>;
}

function Field({
  label,
  children,
  full,
  className,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${full ? "sm:col-span-3" : ""} ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function UFSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="UF" />
      </SelectTrigger>
      <SelectContent>
        {UF.map((u) => (
          <SelectItem key={u} value={u}>
            {u}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KindOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition border ${
        active
          ? "bg-primary/15 border-primary/40 text-foreground"
          : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground"
      }`}
    >
      <span
        className={`size-8 grid place-items-center rounded-md ${active ? "bg-primary/20 text-primary" : "bg-card border border-border/70"}`}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function DocumentUploadField({
  label,
  value,
  onChange,
  onZoom,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onZoom: (val: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressImage(file);
      onChange(base64);
    } catch {
      toast.error("Erro ao carregar imagem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-surface h-36 flex items-center justify-center group">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onZoom(value)}
              className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
              title="Visualizar imagem"
            >
              <Eye className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition"
              title="Remover imagem"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="border border-dashed border-border hover:border-primary/50 rounded-lg h-36 flex flex-col items-center justify-center gap-2 cursor-pointer bg-surface/50 hover:bg-surface/80 transition relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          {loading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clique para subir</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
