import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BufferType, Gaiola } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GaiolaDetailDialog } from "@/components/dashboard/GaiolaDetailDialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { usePersistedState } from "@/hooks/use-persisted-state";

const BUFFERS: BufferType[] = ["RTS", "EHA", "SALVADOS"];

export function MapScreen() {
  const { rows } = useDashboard();
  const [buffer, setBuffer] = usePersistedState<BufferType>(
    "rts.map.buffer",
    "RTS",
  );
  const [selected, setSelected] = useState<{
    primary: Gaiola;
    extras: Gaiola[];
  } | null>(null);

  const bufferRows = useMemo(
    () => rows.filter((r) => r.buffer === buffer),
    [rows, buffer],
  );

  // Index by (rua 1..10, pos 1..7).
  const grid = useMemo(() => {
    const map = new Map<string, Gaiola[]>();
    bufferRows.forEach((r) => {
      if (r.ruaNum == null) return;
      const idx = ((r.ruaNum - 1) % 70 + 70) % 70;
      const rua = Math.floor(idx / 7) + 1;
      const pos = (idx % 7) + 1;
      const k = `${rua}-${pos}`;
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    });
    return map;
  }, [bufferRows]);

  const totalOcupadas = grid.size;
  const totalAlert = bufferRows.filter((r) => r.agingDays > 7).length;
  const occupancyPct = Math.round((totalOcupadas / 70) * 100);

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Buffer
            </p>
            <h3 className="text-xl font-bold">Mapa físico · 10 ruas × 7 posições</h3>
          </div>
          <Select value={buffer} onValueChange={(v) => setBuffer(v as BufferType)}>
            <SelectTrigger className="w-44 bg-background/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-elevated">
              {BUFFERS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Stat label="Ocupação" value={`${totalOcupadas}/70`} sub={`${occupancyPct}%`} tone="default" />
          <Stat label="Alertas (>7d)" value={totalAlert} tone="danger" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-elevated rounded-2xl p-5"
      >
        <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px]">
          <Legend className="bg-[oklch(0.66_0.22_32/0.18)] border-[oklch(0.66_0.22_32/0.6)]" label="RTS" />
          <Legend className="bg-[oklch(0.65_0.20_245/0.18)] border-[oklch(0.65_0.20_245/0.6)]" label="EHA" />
          <Legend className="bg-[oklch(0.70_0.17_155/0.18)] border-[oklch(0.70_0.17_155/0.6)]" label="SALVADOS" />
          <Legend className="bg-destructive/30 border-destructive/70 animate-pulse" label="Alerta (>7d)" />
          <Legend className="bg-muted/30 border-dashed border-border/40" label="Vazio" />
          <span className="ml-auto text-muted-foreground">
            Clique em uma célula para ver detalhes
          </span>
        </div>

        <TooltipProvider delayDuration={120}>
          <div className="scrollbar-thin overflow-x-auto pb-2">
            <div className="min-w-[820px] space-y-2">
              {Array.from({ length: 10 }, (_, rIdx) => {
                const ruaNum = rIdx + 1;
                return (
                  <div key={ruaNum} className="flex items-center gap-3">
                    <div className="flex w-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/40 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Rua {String(ruaNum).padStart(2, "0")}
                    </div>
                    <div className="grid flex-1 grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, pIdx) => {
                        const pos = pIdx + 1;
                        const items = grid.get(`${ruaNum}-${pos}`) ?? [];
                        return (
                          <Cell
                            key={pos}
                            items={items}
                            pos={pos}
                            onSelect={(it, ex) => setSelected({ primary: it, extras: ex })}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      </motion.div>

      <GaiolaDetailDialog
        gaiola={selected?.primary ?? null}
        extras={selected?.extras ?? []}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

// Buffer color tokens — RTS=orange (primary), EHA=blue, SALVADOS=green.
// Aging > 7 dias sobrescreve com vermelho de alerta.
const BUFFER_TONES: Record<BufferType, string> = {
  RTS: "border-[oklch(0.66_0.22_32/0.7)] bg-[oklch(0.66_0.22_32/0.18)] hover:ring-[oklch(0.66_0.22_32/0.5)]",
  EHA: "border-[oklch(0.65_0.20_245/0.7)] bg-[oklch(0.65_0.20_245/0.18)] hover:ring-[oklch(0.65_0.20_245/0.5)]",
  SALVADOS:
    "border-[oklch(0.70_0.17_155/0.7)] bg-[oklch(0.70_0.17_155/0.18)] hover:ring-[oklch(0.70_0.17_155/0.5)]",
};

const ALERT_THRESHOLD_DAYS = 7;

function Cell({
  items,
  pos,
  onSelect,
}: {
  items: Gaiola[];
  pos: number;
  onSelect: (item: Gaiola, extras: Gaiola[]) => void;
}) {
  const item = items[0];
  const extras = items.slice(1);
  const extra = extras.length;

  if (!item) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/30 bg-background/20 text-[10px] text-muted-foreground/50">
        {pos.toString().padStart(2, "0")}
      </div>
    );
  }

  // Alerta sobrescreve a cor do buffer
  const isAlert = item.agingDays > ALERT_THRESHOLD_DAYS;
  const tone = isAlert
    ? "border-destructive/70 bg-destructive/25 hover:ring-destructive/60 text-destructive-foreground"
    : BUFFER_TONES[item.buffer];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04, y: -2 }}
          onClick={() => onSelect(item, extras)}
          className={cn(
            "group relative flex h-24 flex-col justify-between overflow-hidden rounded-lg border-2 p-2 text-left transition-colors hover:ring-2",
            tone,
            isAlert && "animate-pulse-glow",
          )}
        >
          {/* Top: CÓDIGO em destaque + PERFIL como badge */}
          <div className="flex items-start justify-between gap-1">
            <span className="truncate font-mono text-[13px] font-extrabold leading-none tracking-tight">
              {item.codigo}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-black leading-none",
                isAlert
                  ? "bg-background/80 text-destructive"
                  : "bg-background/60 text-foreground ring-1 ring-border/60",
              )}
            >
              {item.perfil}
            </span>
          </div>

          {/* Bottom: CATEGORIA destacada + aging */}
          <div className="flex items-end justify-between gap-1">
            <span className="truncate text-[10px] font-bold uppercase leading-tight tracking-wide">
              {item.categoria}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-[11px] font-bold tabular-nums",
                isAlert && "text-destructive",
              )}
            >
              {item.dataHora ? `${item.agingDays.toFixed(0)}d` : "—"}
            </span>
          </div>

          {extra > 0 && (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-foreground px-1.5 text-[9px] font-black text-background">
              +{extra}
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent className="glass-elevated max-w-xs border-border/60">
        <div className="space-y-1 text-xs">
          <p className="font-mono font-bold">{item.codigo}</p>
          <p className="text-muted-foreground">
            Buffer: <span className="text-foreground">{item.buffer}</span>
          </p>
          <p className="text-muted-foreground">
            Rua: <span className="font-mono text-foreground">{item.rua}</span>
          </p>
          <p className="text-muted-foreground">
            Categoria: <span className="text-foreground">{item.categoria}</span>
          </p>
          <p className="text-muted-foreground">
            Perfil: <span className="text-foreground">{item.perfil}</span>
          </p>
          <p className="text-muted-foreground">
            Turno: <span className="text-foreground">{item.turno}</span>
          </p>
          <p className="text-muted-foreground">
            Entrada:{" "}
            <span className="text-foreground">
              {item.dataHora ? format(item.dataHora, "dd/MM HH:mm") : "—"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Aging:{" "}
            <span className={cn("text-foreground", isAlert && "font-bold text-destructive")}>
              {item.agingDays.toFixed(1)}d
            </span>
          </p>
          {isAlert && (
            <p className="mt-1 text-[10px] font-bold uppercase text-destructive">
              ⚠ Alerta — aging acima de {ALERT_THRESHOLD_DAYS} dias
            </p>
          )}
          <p className="mt-1 text-[10px] italic text-primary">
            Clique para ver detalhes completos
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-3 w-3 rounded border", className)} />
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: "default" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/30 px-3 py-2",
        tone === "default" && "border-border/60",
        tone === "warning" && "border-warning/40 text-warning",
        tone === "danger" && "border-destructive/40 text-destructive",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-lg font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-xs font-medium opacity-70">({sub})</span>}
      </p>
    </div>
  );
}
