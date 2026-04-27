import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Gaiola } from "@/lib/dashboard/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Box,
  Clock,
  Hash,
  MapPin,
  ShieldAlert,
  Tag,
  TrendingUp,
} from "lucide-react";

interface Props {
  gaiola: Gaiola | null;
  extras?: Gaiola[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GaiolaDetailDialog({ gaiola, extras = [], open, onOpenChange }: Props) {
  if (!gaiola) return null;
  const status = gaiola.isLost ? "lost" : gaiola.isAtRisk ? "risk" : "ok";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-elevated max-w-md border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold",
                status === "lost" && "border-destructive/50 bg-destructive/15 text-destructive",
                status === "risk" && "border-warning/50 bg-warning/15 text-warning",
                status === "ok" && "border-success/50 bg-success/15 text-success",
              )}
            >
              {gaiola.perfil}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-mono text-lg">{gaiola.codigo}</DialogTitle>
              <DialogDescription>
                <span
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    status === "lost" && "border-destructive/50 bg-destructive/15 text-destructive",
                    status === "risk" && "border-warning/50 bg-warning/15 text-warning",
                    status === "ok" && "border-success/50 bg-success/15 text-success",
                  )}
                >
                  {status === "lost" ? "LOST" : status === "risk" ? "EM RISCO" : "SAUDÁVEL"}
                </span>
                <span className="ml-2 text-xs">{gaiola.buffer}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3">
          <DetailRow icon={MapPin} label="Rua">
            <span className="font-mono">{gaiola.rua}</span>
          </DetailRow>
          <DetailRow icon={Tag} label="Categoria">
            {gaiola.categoria}
          </DetailRow>
          <DetailRow icon={Box} label="Perfil">
            <span className="font-mono font-bold">{gaiola.perfil}</span>{" "}
            <span className="text-xs text-muted-foreground">
              (~{gaiola.estimatedPackages} pacotes)
            </span>
          </DetailRow>
          <DetailRow icon={Hash} label="Turno">
            <span className="font-mono">{gaiola.turno}</span>
          </DetailRow>
          <DetailRow icon={Clock} label="Entrada">
            {gaiola.dataHora
              ? format(gaiola.dataHora, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : "—"}
          </DetailRow>
          <DetailRow icon={TrendingUp} label="Aging">
            <span
              className={cn(
                "font-mono font-bold",
                status === "lost" && "text-destructive",
                status === "risk" && "text-warning",
              )}
            >
              {gaiola.dataHora
                ? `${gaiola.agingDays.toFixed(1)}d (${gaiola.agingHours.toFixed(0)}h)`
                : "—"}
            </span>
          </DetailRow>
          {status !== "ok" && (
            <DetailRow icon={ShieldAlert} label="Risco">
              <span
                className={cn(
                  status === "lost" ? "text-destructive" : "text-warning",
                )}
              >
                {status === "lost"
                  ? "Aging superior a 14 dias — tratativa imediata"
                  : "Aging entre 10 e 14 dias — monitorar"}
              </span>
            </DetailRow>
          )}
        </div>

        {extras.length > 0 && (
          <div className="mt-2 rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              + {extras.length} outras gaiolas nesta posição
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {extras.map((g) => (
                <li key={g.id} className="flex items-center justify-between font-mono">
                  <span>{g.codigo}</span>
                  <span className="text-muted-foreground">
                    {g.perfil} · {g.dataHora ? `${g.agingDays.toFixed(1)}d` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 p-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}
