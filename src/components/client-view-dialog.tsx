import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Client,
  calcClientCommission,
  calcReferrerCommission,
  formatBRL,
} from "@/lib/clients-store";
import {
  User,
  MapPin,
  Landmark,
  Wallet,
  Share2,
  Users,
  Phone,
  Mail,
  FileText,
  Calendar,
  Building,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client | null;
  clients: Client[];
};

export function ClientViewDialog({ open, onOpenChange, client, clients }: Props) {
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);

  if (!client) return null;

  const isReferrer = client.kind === "indicador";
  const referrer = client.referrerId ? clients.find((c) => c.id === client.referrerId) : null;
  const indicated = clients.filter((c) => c.referrerId === client.id);
  const clientComm = calcClientCommission(client);
  const refComm = calcReferrerCommission(client);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl grid place-items-center text-sm font-semibold border border-border/70 shrink-0"
              style={{ background: "var(--gradient-surface)" }}
            >
              {client.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join("")}
            </div>
            <div>
              <DialogTitle className="text-base">{client.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {isReferrer ? (
                  <Badge className="text-[10px] gap-1 bg-warning/15 text-warning border-warning/20">
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
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-5 space-y-7">
            {/* Contato */}
            <Section icon={<User className="size-4" />} title="Dados pessoais">
              <Grid>
                <Info label="CPF" value={client.cpf} />
                <Info
                  label="Data de nascimento"
                  value={client.birthDate ? formatDate(client.birthDate) : undefined}
                />
                <Info label="Nome da mãe" value={client.motherName} />
                <Info label="RG" value={client.rg} />
                <Info
                  label="Data de emissão"
                  value={client.rgIssueDate ? formatDate(client.rgIssueDate) : undefined}
                />
                <Info label="Estado de emissão" value={client.rgIssueState} />
                <Info label="E-mail" value={client.email} />
                <Info label="Telefone" value={client.phone} />
              </Grid>
            </Section>

            {/* Documentos */}
            {(client.docFront || client.docBack) && (
              <Section icon={<FileText className="size-4" />} title="Documentos (RG / CNH)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {client.docFront && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Frente
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedImage({
                            src: client.docFront!,
                            title: "Frente do documento",
                          })
                        }
                        className="relative block w-full rounded-lg overflow-hidden border border-border bg-surface h-36 group cursor-pointer text-left"
                      >
                        <img
                          src={client.docFront}
                          alt="Frente do documento"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs bg-black/60 text-white px-2.5 py-1 rounded-md border border-white/10 font-medium">
                            Visualizar original
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                  {client.docBack && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Verso
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedImage({
                            src: client.docBack!,
                            title: "Verso do documento",
                          })
                        }
                        className="relative block w-full rounded-lg overflow-hidden border border-border bg-surface h-36 group cursor-pointer text-left"
                      >
                        <img
                          src={client.docBack}
                          alt="Verso do documento"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs bg-black/60 text-white px-2.5 py-1 rounded-md border border-white/10 font-medium">
                            Visualizar original
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Endereço */}
            <Section icon={<MapPin className="size-4" />} title="Endereço">
              <Grid>
                <Info label="CEP" value={client.zip} />
                <Info label="Rua" value={client.street} className="col-span-2" />
                <Info label="Número" value={client.number} />
                <Info label="Complemento" value={client.complement} />
                <Info label="Bairro" value={client.district} />
                <Info label="Cidade" value={client.city} />
                <Info label="Estado" value={client.state} />
              </Grid>
            </Section>

            {/* Bancário */}
            <Section icon={<Landmark className="size-4" />} title="Dados bancários">
              <Grid>
                <Info label="Banco" value={client.bank} className="col-span-2" />
                <Info
                  label="Tipo de conta"
                  value={
                    client.accountType === "corrente"
                      ? "Conta corrente"
                      : client.accountType === "poupanca"
                        ? "Poupança"
                        : undefined
                  }
                />
                <Info label="Agência" value={client.agency} />
                <Info label="Conta" value={client.account} />
              </Grid>
            </Section>

            {/* Financeiro */}
            {!isReferrer && (
              <Section icon={<Wallet className="size-4" />} title="Financeiro">
                <Grid>
                  <Info label="Valor total" value={formatBRL(client.totalValue)} />
                  <Info
                    label={`Comissão cliente (${client.percentage}%)`}
                    value={formatBRL(clientComm)}
                    highlight="success"
                  />
                  {referrer ? (
                    <Info
                      label="Comissão indicador"
                      value={formatBRL(refComm)}
                      highlight="primary"
                    />
                  ) : (
                    <Info label="Indicação" value="—" />
                  )}
                  <Info
                    label="Líquido"
                    value={formatBRL(client.totalValue - clientComm - refComm)}
                  />
                </Grid>
              </Section>
            )}

            {/* Indicações do indicador */}
            {isReferrer && indicated.length > 0 && (
              <Section icon={<Share2 className="size-4" />} title="Indicações">
                <div className="space-y-2">
                  {indicated.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-surface border border-border/70"
                    >
                      <span>{i.name}</span>
                      <span className="text-muted-foreground">
                        {formatBRL(calcReferrerCommission(i))}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-primary/10 border border-primary/20 mt-2">
                    <span className="font-medium text-primary">Total em comissões</span>
                    <span className="font-semibold text-primary">
                      {formatBRL(indicated.reduce((s, i) => s + calcReferrerCommission(i), 0))}
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {client.notes && (
              <Section icon={<FileText className="size-4" />} title="Notas">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </Section>
            )}
          </div>
        </ScrollArea>
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

function Info({
  label,
  value,
  className,
  highlight,
}: {
  label: string;
  value?: string | number;
  className?: string;
  highlight?: "success" | "primary";
}) {
  const color =
    highlight === "success"
      ? "text-success"
      : highlight === "primary"
        ? "text-primary"
        : "text-foreground";
  return (
    <div className={`space-y-0.5 ${className ?? ""}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value ?? "—"}</p>
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
