import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/dashboard/context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  FiltersBar,
  applyFilters,
  useFilters,
} from "@/components/dashboard/FiltersBar";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import {
  CategoryPills,
  type CategoryOption,
} from "@/components/dashboard/CategoryPills";
import {
  EmptyState,
  ErrorState,
  KpiSkeleton,
  TableSkeleton,
} from "@/components/dashboard/States";
import {
  ArrowDownAZ,
  Box,
  Clock,
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
import { usePersistedState } from "@/hooks/use-persisted-state";

/** Mutually exclusive operational categories — Tela 1 */
const CATEGORY_DEFS: Omit<CategoryOption, "count">[] = [
  {
    id: "rts-all",
    label: "RTS",
    match: (_cat, buf) => buf === "RTS",
  },
  {
    id: "eha-all",
    label: "EHA",
    match: (_cat, buf) => buf === "EHA",
  },
  {
    id: "off-com-id",
    label: "Off com ID",
    match: (cat) => cat === "Off com ID",
  },
  {
    id: "off-sem-id",
    label: "Off sem ID",
    match: (cat) => cat === "Salvados sem ID" || cat === "Outros",
  },
  {
    id: "online",
    label: "Online (RTS)",
    match: (cat, buf) => buf === "RTS" && cat === "Online",
  },
];

export function OperationScreen() {
  const { rows, loading, error, refresh } = useDashboard();
  const { filters, setFilters, effective } = useFilters("rts.filters.operation");
  const [activeCat, setActiveCat] = usePersistedState<string>(
    "rts.filters.operation.cat",
    "all",
  );

  // Tela 1: foco em EHA + RTS (esconder Salvados desta visão)
  const opRows = useMemo(
    () => rows.filter((r) => r.buffer !== "SALVADOS"),
    [rows],
  );

  // Aplicar filtro exclusivo de categoria PRIMEIRO
  const catFiltered = useMemo(() => {
    if (activeCat === "all") return opRows;
    const def = CATEGORY_DEFS.find((c) => c.id === activeCat);
    if (!def) return opRows;
    return opRows.filter((r) => def.match(r.categoria, r.buffer));
  }, [opRows, activeCat]);

  const filtered = useMemo(
    () => applyFilters(catFiltered, effective),
    [catFiltered, effective],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => (b.dataHora ? b.agingHours : 0) - (a.dataHora ? a.agingHours : 0),
      ),
    [filtered],
  );

  // Counts per category for the pills (computed on opRows pre-search)
  const categories = useMemo<CategoryOption[]>(
    () =>
      CATEGORY_DEFS.map((c) => ({
        ...c,
        count: opRows.filter((r) => c.match(r.categoria, r.buffer)).length,
      })),
    [opRows],
  );

  const totalGaiolas = filtered.length;
  const totalPacotes = filtered.reduce((s, r) => s + r.estimatedPackages, 0);
  const lostGaiolas = filtered.filter((r) => r.isLost).length;
  const lostPacotes = filtered
    .filter((r) => r.isLost)
    .reduce((s, r) => s + r.estimatedPackages, 0);

  // Aging metrics — somente gaiolas com data válida entram no cálculo
  const withAging = filtered.filter((r) => r.dataHora);
  const avgAging =
    withAging.length > 0
      ? withAging.reduce((s, r) => s + r.agingDays, 0) / withAging.length
      : 0;
  const maxAging = withAging.reduce((m, r) => Math.max(m, r.agingDays), 0);
  const atRiskCount = filtered.filter((r) => r.isAtRisk && !r.isLost).length;
  const agingTone: "default" | "warning" | "danger" =
    avgAging >= 14 ? "danger" : avgAging >= 10 ? "warning" : "default";

  const ehaCount = filtered.filter((r) => r.buffer === "EHA").length;
  const rtsCount = filtered.filter((r) => r.buffer === "RTS").length;
  const donutData = [
    { name: "EHA", value: ehaCount, fill: "var(--color-chart-2)" },
    { name: "RTS", value: rtsCount, fill: "var(--color-chart-1)" },
  ];

  const showSkeleton = loading && rows.length === 0;
  const showError = !!error && rows.length === 0;

  return (
    <div className="space-y-5">
      {/* alert bar */}
      <AnimatePresence>
        {lostGaiolas > 0 && (
          <AlertBanner
            tone="danger"
            title={`⚠ ${lostGaiolas} gaiola(s) em risco de LOST`}
            description={`Aging acima de 14 dias detectado · Aprox. ${lostPacotes.toLocaleString("pt-BR")} pacote(s) requerem tratativa imediata`}
            action={
              <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive/80">
                Ação requerida
              </span>
            }
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {showSkeleton ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              index={0}
              label="Total de pacotes"
              value={totalPacotes.toLocaleString("pt-BR")}
              hint="Estimativa por perfil"
              icon={<Package className="h-5 w-5" />}
            />
            <KpiCard
              index={1}
              label="Total de gaiolas"
              value={totalGaiolas.toLocaleString("pt-BR")}
              hint={`${ehaCount} EHA · ${rtsCount} RTS`}
              icon={<Container className="h-5 w-5" />}
              tone="info"
            />
            <KpiCard
              index={2}
              label="Aging médio"
              value={
                withAging.length > 0 ? `${avgAging.toFixed(1)}d` : "—"
              }
              hint={
                withAging.length > 0
                  ? `Máx ${maxAging.toFixed(1)}d · ${atRiskCount} em atenção`
                  : "Sem datas válidas"
              }
              tone={agingTone}
              icon={<Clock className="h-5 w-5" />}
            />
            <KpiCard
              index={3}
              label="Pacotes em risco LOST"
              value={lostPacotes.toLocaleString("pt-BR")}
              hint=">14 dias na operação"
              tone="danger"
              icon={<Box className="h-5 w-5" />}
            />
            <KpiCard
              index={4}
              label="Gaiolas em risco"
              value={lostGaiolas.toLocaleString("pt-BR")}
              hint="Status LOST"
              tone="danger"
              icon={<ShieldAlert className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <CategoryPills options={categories} value={activeCat} onChange={setActiveCat} />

      <FiltersBar
        rows={catFiltered}
        value={filters}
        onChange={setFilters}
        hideCategoria
      />

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
          {showError ? (
            <ErrorState message={error!} onRetry={refresh} />
          ) : showSkeleton ? (
            <TableSkeleton />
          ) : sorted.length === 0 ? (
            <EmptyState
              title="Nenhum registro corresponde aos filtros"
              description="Tente limpar os filtros ou ajustar a categoria."
            />
          ) : (
            <RegistryTable rows={sorted} />
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
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
                  isAnimationActive={false}
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
        </motion.div>
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

function RegistryTable({ rows }: { rows: Gaiola[] }) {
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

// Silence unused-var warnings if any
void useState;
