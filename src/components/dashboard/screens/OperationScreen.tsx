import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FiltersBar, applyFilters, initialFilters } from "@/components/dashboard/FiltersBar";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import {
  AlertOctagon,
  ArrowDownAZ,
  Box,
  Container,
  Package,
  ShieldAlert,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Gaiola } from "@/lib/dashboard/types";
import { format } from "date-fns";

export function OperationScreen() {
  const { rows, loading, error } = useDashboard();
  const [filters, setFilters] = useState(initialFilters);

  // Tela 1 foco: EHA + RTS (esconder Salvados)
  const opRows = useMemo(
    () => rows.filter((r) => r.buffer !== "SALVADOS"),
    [rows],
  );
  const filtered = useMemo(() => applyFilters(opRows, filters), [opRows, filters]);
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => (b.dataHora ? b.agingHours : 0) - (a.dataHora ? a.agingHours : 0),
      ),
    [filtered],
  );

  const totalGaiolas = filtered.length;
  const totalPacotes = filtered.reduce((s, r) => s + r.estimatedPackages, 0);
  const lostGaiolas = filtered.filter((r) => r.isLost).length;
  const lostPacotes = filtered
    .filter((r) => r.isLost)
    .reduce((s, r) => s + r.estimatedPackages, 0);

  const ehaCount = filtered.filter((r) => r.buffer === "EHA").length;
  const rtsCount = filtered.filter((r) => r.buffer === "RTS").length;
  const donutData = [
    { name: "EHA", value: ehaCount, fill: "var(--color-chart-2)" },
    { name: "RTS", value: rtsCount, fill: "var(--color-chart-1)" },
  ];

  return (
    <div className="space-y-5">
      {/* alert bar */}
      {lostGaiolas > 0 && (
        <div className="animate-pulse-glow flex items-center gap-3 overflow-hidden rounded-2xl border border-destructive/50 bg-destructive/10 px-5 py-3 backdrop-blur">
          <AlertOctagon className="h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">
              ⚠ {lostGaiolas} gaiola(s) em risco de LOST
            </p>
            <p className="text-xs text-destructive/80">
              Aging acima de 14 dias detectado · Aprox. {lostPacotes.toLocaleString("pt-BR")}{" "}
              pacote(s) requerem tratativa imediata
            </p>
          </div>
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-destructive/80 md:block">
            Ação requerida
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de pacotes"
          value={totalPacotes.toLocaleString("pt-BR")}
          hint="Estimativa por perfil"
          icon={<Package className="h-5 w-5" />}
        />
        <KpiCard
          label="Total de gaiolas"
          value={totalGaiolas.toLocaleString("pt-BR")}
          hint={`${ehaCount} EHA · ${rtsCount} RTS`}
          icon={<Container className="h-5 w-5" />}
        />
        <KpiCard
          label="Pacotes em risco LOST"
          value={lostPacotes.toLocaleString("pt-BR")}
          hint=">14 dias na operação"
          tone="danger"
          icon={<Box className="h-5 w-5" />}
        />
        <KpiCard
          label="Gaiolas em risco"
          value={lostGaiolas.toLocaleString("pt-BR")}
          hint="Status LOST"
          tone="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      <FiltersBar rows={opRows} value={filters} onChange={setFilters} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Registros · ordem por idade (mais antigas no topo)
            </h3>
            <span className="hidden text-[11px] uppercase tracking-wider text-muted-foreground md:block">
              <ArrowDownAZ className="mr-1 inline h-3 w-3" />
              {sorted.length} itens
            </span>
          </div>
          <RegistryTable rows={sorted} loading={loading} error={error} />
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
            Ocupação do buffer
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="oklch(0.10 0 0)"
                  strokeWidth={2}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.012 30)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    color: "white",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <LegendItem
              color="var(--color-chart-2)"
              label="EHA"
              value={ehaCount}
              total={ehaCount + rtsCount || 1}
            />
            <LegendItem
              color="var(--color-chart-1)"
              label="RTS"
              value={rtsCount}
              total={ehaCount + rtsCount || 1}
            />
          </div>
        </div>
      </div>

      <InsightsPanel rows={filtered} />
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = ((value / total) * 100).toFixed(0);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-bold tabular-nums">
          {value} <span className="text-xs text-muted-foreground">({pct}%)</span>
        </p>
      </div>
    </div>
  );
}

function RegistryTable({
  rows,
  loading,
  error,
}: {
  rows: Gaiola[];
  loading: boolean;
  error: string | null;
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Carregando registros...
      </div>
    );
  }
  if (error && rows.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-destructive">
        <AlertOctagon className="h-5 w-5" />
        Falha ao carregar dados: {error}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nenhum registro corresponde aos filtros.
      </div>
    );
  }

  return (
    <div className="scrollbar-thin max-h-[480px] overflow-auto rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur">
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2.5 font-semibold">Código</th>
            <th className="px-3 py-2.5 font-semibold">Buffer</th>
            <th className="px-3 py-2.5 font-semibold">Rua</th>
            <th className="px-3 py-2.5 font-semibold">Categoria</th>
            <th className="px-3 py-2.5 font-semibold">Perfil</th>
            <th className="px-3 py-2.5 font-semibold">Turno</th>
            <th className="px-3 py-2.5 font-semibold">Aging</th>
            <th className="px-3 py-2.5 font-semibold">Entrada</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={cn(
                "border-t border-border/30 transition-colors hover:bg-background/40",
                r.isLost && "bg-destructive/15 hover:bg-destructive/20",
                !r.isLost && r.isAtRisk && "bg-warning/10 hover:bg-warning/20",
              )}
            >
              <td className="px-3 py-2 font-mono text-xs font-semibold">
                {r.codigo}
                {r.isLost && (
                  <span className="ml-2 rounded-full border border-destructive/60 bg-destructive/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive">
                    LOST
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-xs">
                <BufferTag buffer={r.buffer} />
              </td>
              <td className="px-3 py-2 font-mono text-xs">{r.rua}</td>
              <td className="px-3 py-2 text-xs">{r.categoria}</td>
              <td className="px-3 py-2 text-xs">
                <span className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 font-mono">
                  {r.perfil}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">{r.turno}</td>
              <td className="px-3 py-2 text-xs tabular-nums">
                <span
                  className={cn(
                    r.isLost && "font-bold text-destructive",
                    !r.isLost && r.isAtRisk && "font-semibold text-warning",
                  )}
                >
                  {r.dataHora ? `${r.agingDays.toFixed(1)}d` : "—"}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                {r.dataHora ? format(r.dataHora, "dd/MM HH:mm") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BufferTag({ buffer }: { buffer: string }) {
  const map: Record<string, string> = {
    EHA: "border-chart-2/40 bg-chart-2/15 text-chart-2",
    RTS: "border-primary/40 bg-primary/15 text-primary",
    SALVADOS: "border-warning/40 bg-warning/15 text-warning",
  };
  const cls = map[buffer] ?? "border-border bg-background/40";
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        cls,
      )}
    >
      {buffer}
    </span>
  );
}
