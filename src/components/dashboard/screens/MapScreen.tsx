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
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/30 bg-background/20 text-[10px] text-muted-foreground/50">
        {pos.toString().padStart(2, "0")}
      </div>
    );
  }

  const tone = item.isLost
    ? "border-destructive/60 bg-destructive/15 ring-destructive/40"
    : item.isAtRisk
      ? "border-warning/60 bg-warning/15 ring-warning/40"
      : "border-success/40 bg-success/10 ring-success/30";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04, y: -2 }}
          onClick={() => onSelect(item, extras)}
          className={cn(
            "group relative flex h-20 flex-col justify-between overflow-hidden rounded-lg border p-1.5 text-left transition-colors hover:ring-2",
            tone,
            item.isLost && "animate-pulse",
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="truncate font-mono text-[10px] font-bold leading-tight">
              {item.codigo}
            </span>
            <span className="rounded border border-border/60 bg-background/40 px-1 py-0 font-mono text-[9px] leading-tight">
              {item.perfil}
            </span>
          </div>
          <div className="flex items-end justify-between gap-1">
            <span className="truncate text-[8px] uppercase leading-tight text-muted-foreground">
              {item.categoria}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-[9px] tabular-nums",
                item.isLost && "font-bold text-destructive",
                item.isAtRisk && !item.isLost && "font-semibold text-warning",
              )}
            >
              {item.dataHora ? `${item.agingDays.toFixed(0)}d` : ""}
            </span>
          </div>
          {extra > 0 && (
            <span className="absolute right-1 top-1 rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
              +{extra}
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent className="glass-elevated max-w-xs border-border/60">
        <div className="space-y-1 text-xs">
          <p className="font-mono font-bold">{item.codigo}</p>
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
            Aging: <span className="text-foreground">{item.agingDays.toFixed(1)}d</span>
          </p>
          <p className="mt-1 text-[10px] italic text-primary">
            Clique para ver detalhes completos
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-3 w-3 rounded border", color)} />
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
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
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
