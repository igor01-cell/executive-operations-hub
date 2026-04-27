import { useMemo } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  FiltersBar,
  applyFilters,
  useFilters,
} from "@/components/dashboard/FiltersBar";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  Hourglass,
  Package,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  buildTimeline,
  computeSalvadosMetrics,
} from "@/lib/dashboard/insights";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { motion } from "framer-motion";
import type { Gaiola } from "@/lib/dashboard/types";

export function SalvadosScreen() {
  const { rows } = useDashboard();
  const [tab, setTab] = usePersistedState<string>("rts.salvados.tab", "buffer");

  // Aba 1: itens com buffer físico SALVADOS
  const bufferRows = useMemo(
    () => rows.filter((r) => r.buffer === "SALVADOS"),
    [rows],
  );
  // Aba 2: itens LOST (aging ≥ 14d) em qualquer buffer
  const allLostRows = useMemo(() => rows.filter((r) => r.isLost), [rows]);

  return (
    <div className="space-y-5">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass h-auto rounded-2xl p-1.5">
          <TabsTrigger
            value="buffer"
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
          >
            Buffer Salvados
            <span className="ml-2 rounded-full bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums">
              {bufferRows.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="all-lost"
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
          >
            Todos LOST (≥14d)
            <span className="ml-2 rounded-full bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums">
              {allLostRows.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buffer" className="mt-5 space-y-5">
          <SalvadosBufferView rows={bufferRows} />
        </TabsContent>

        <TabsContent value="all-lost" className="mt-5 space-y-5">
          <AllLostView rows={allLostRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─────────────────────────── ABA 1: Buffer físico SALVADOS ─────────────────────────── */

function SalvadosBufferView({ rows: baseRows }: { rows: Gaiola[] }) {
  const { filters, setFilters, effective } = useFilters("rts.filters.salvados");
  const filtered = useMemo(
    () => applyFilters(baseRows, effective),
    [baseRows, effective],
  );
  const metrics = useMemo(() => computeSalvadosMetrics(filtered), [filtered]);

  const semId = filtered.filter((r) => r.categoria === "Salvados sem ID").length;

  // Distribuição por perfil
  const perfilData = ["P", "M", "G"].map((p) => ({
    perfil: p,
    gaiolas: filtered.filter((r) => r.perfil === p).length,
  }));

  // Distribuição por categoria
  const catMap = filtered.reduce<Record<string, number>>((acc, r) => {
    acc[r.categoria] = (acc[r.categoria] ?? 0) + 1;
    return acc;
  }, {});
  const catData = Object.entries(catMap).map(([name, value], i) => ({
    name,
    value,
    fill: [
      "var(--color-chart-1)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
      "var(--color-chart-2)",
    ][i % 5],
  }));

  const timeline = useMemo(() => buildTimeline(filtered, 30), [filtered]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Total de salvados"
          value={metrics.total}
          icon={<Boxes className="h-5 w-5" />}
          hint="Buffer reverso"
        />
        <KpiCard
          index={1}
          label="Pacotes (estim.)"
          value={metrics.totalPacotes.toLocaleString("pt-BR")}
          icon={<Package className="h-5 w-5" />}
          hint="Inventário para leilão"
          tone="warning"
        />
        <KpiCard
          index={2}
          label="Sem identificação"
          value={semId}
          icon={<Tag className="h-5 w-5" />}
          tone={semId > 0 ? "warning" : "success"}
          hint="Requer catalogação manual"
        />
        <KpiCard
          index={3}
          label="Aging médio"
          value={`${metrics.total ? (filtered.reduce((s, r) => s + r.agingDays, 0) / metrics.total).toFixed(1) : "0.0"}d`}
          icon={<Hourglass className="h-5 w-5" />}
          hint={`Mais antigo: ${metrics.oldestDays.toFixed(0)}d`}
          tone={metrics.oldestDays > 21 ? "danger" : metrics.oldestDays > 14 ? "warning" : "default"}
        />
      </div>

      <FiltersBar
        rows={baseRows}
        value={filters}
        onChange={setFilters}
        hideBuffer
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Distribuição por perfil">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perfilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="perfil" stroke="oklch(0.7 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="gaiolas" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Por categoria">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={catData}
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                stroke="oklch(0.10 0 0)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {catData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução (últimos 30 dias)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="gradEvo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-blue)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-accent-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="date" stroke="oklch(0.7 0 0)" fontSize={10} interval={4} />
              <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent-blue)"
                strokeWidth={2}
                fill="url(#gradEvo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <InsightsPanel rows={filtered} />
    </>
  );
}

/* ─────────────────────────── ABA 2: Todos LOST ─────────────────────────── */

function AllLostView({ rows: baseRows }: { rows: Gaiola[] }) {
  const { filters, setFilters, effective } = useFilters("rts.filters.all-lost");
  const filtered = useMemo(
    () => applyFilters(baseRows, effective),
    [baseRows, effective],
  );
  const metrics = useMemo(() => computeSalvadosMetrics(filtered), [filtered]);

  // Distribuição por buffer
  const bufferData = ["RTS", "EHA", "SALVADOS"].map((b) => ({
    name: b,
    value: filtered.filter((r) => r.buffer === b).length,
    fill:
      b === "RTS"
        ? "var(--color-chart-1)"
        : b === "EHA"
          ? "var(--color-chart-2)"
          : "var(--color-chart-4)",
  }));

  const timeline = useMemo(() => buildTimeline(filtered, 30), [filtered]);

  const growthLabel =
    metrics.backlogGrowthPct === 0
      ? "Estável"
      : `${metrics.backlogGrowthPct > 0 ? "+" : ""}${metrics.backlogGrowthPct.toFixed(0)}%`;
  const growthTone =
    metrics.backlogGrowthPct > 20
      ? "danger"
      : metrics.backlogGrowthPct > 0
        ? "warning"
        : "success";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4 text-xs text-muted-foreground"
      >
        <span className="font-semibold text-foreground">Definição:</span>{" "}
        Salvados = todos os itens com aging ≥ 14 dias, em qualquer buffer (RTS, EHA ou SALVADOS).
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Total LOST"
          value={metrics.total}
          icon={<Boxes className="h-5 w-5" />}
          hint={`${metrics.totalPacotes.toLocaleString("pt-BR")} pacotes`}
          tone="danger"
        />
        <KpiCard
          index={1}
          label="Tempo médio em LOST"
          value={`${metrics.avgAgingLost.toFixed(1)}d`}
          icon={<Hourglass className="h-5 w-5" />}
          hint={`Mais antigo: ${metrics.oldestDays.toFixed(0)}d`}
          tone="warning"
        />
        <KpiCard
          index={2}
          label="Crescimento de backlog"
          value={growthLabel}
          icon={
            metrics.backlogGrowthPct > 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )
          }
          hint={`Últimos 7d vs 7d anteriores`}
          tone={growthTone}
        />
        <KpiCard
          index={3}
          label="Taxa de expedição (estim.)"
          value={`${metrics.estimatedExpeditionRate.toFixed(1)}/d`}
          icon={<Truck className="h-5 w-5" />}
          hint="Baseado em entradas recentes"
          tone="info"
        />
      </div>

      <FiltersBar rows={baseRows} value={filters} onChange={setFilters} />

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Distribuição por buffer">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bufferData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis type="number" stroke="oklch(0.7 0 0)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="oklch(0.7 0 0)" fontSize={11} width={70} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {bufferData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução temporal de entradas (30d)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="gradLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="date" stroke="oklch(0.7 0 0)" fontSize={10} interval={4} />
              <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-destructive)"
                strokeWidth={2}
                fill="url(#gradLost)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <InsightsPanel rows={filtered} />
    </>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

const tooltipStyle: React.CSSProperties = {
  background: "oklch(0.16 0.012 30)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass rounded-2xl p-5"
    >
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">{title}</h3>
      <div className="h-56">{children}</div>
    </motion.div>
  );
}
