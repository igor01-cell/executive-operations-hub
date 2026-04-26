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
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BUFFERS: BufferType[] = ["RTS", "EHA", "SALVADOS"];

export function MapScreen() {
  const { rows } = useDashboard();
  const [buffer, setBuffer] = useState<BufferType>("RTS");

  const bufferRows = useMemo(
    () => rows.filter((r) => r.buffer === buffer),
    [rows, buffer],
  );

  // Index by (rua 1..10, pos 1..7). Mapping handled in parser.ts.
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
  const totalLost = bufferRows.filter((r) => r.isLost).length;
  const totalRisk = bufferRows.filter((r) => r.isAtRisk && !r.isLost).length;

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
          <Stat label="Posições ocupadas" value={`${totalOcupadas}/70`} tone="default" />
          <Stat label="Em risco" value={totalRisk} tone="warning" />
          <Stat label="LOST" value={totalLost} tone="danger" />
        </div>
      </div>

      <div className="glass-elevated rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px]">
          <Legend color="bg-muted/40 border-border/60" label="Vazio" />
          <Legend color="bg-success/30 border-success/60" label="Normal" />
          <Legend color="bg-warning/40 border-warning/60" label="Atenção (>10d)" />
          <Legend color="bg-destructive/40 border-destructive/60 animate-pulse" label="LOST (>14d)" />
        </div>

        {/* Grid: 10 ruas, 7 posições each. Cinema-style. */}
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
                          <Cell key={pos} items={items} pos={pos} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

function Cell({ items, pos }: { items: Gaiola[]; pos: number }) {
  const item = items[0]; // primary
  const extra = items.length - 1;

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
        <button
          type="button"
          className={cn(
            "group relative flex h-20 flex-col justify-between overflow-hidden rounded-lg border p-1.5 text-left transition-all hover:scale-[1.04] hover:ring-2",
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
        </button>
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
          {extra > 0 && (
            <p className="mt-1 italic text-muted-foreground">
              + {extra} outras gaiolas nesta posição
            </p>
          )}
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
