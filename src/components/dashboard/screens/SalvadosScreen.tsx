import { useMemo } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  FiltersBar,
  applyFilters,
  useFilters,
} from "@/components/dashboard/FiltersBar";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
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
  Truck,
} from "lucide-react";
import {
  buildTimeline,
  computeReverseBufferMetrics,
} from "@/lib/dashboard/insights";
import { motion } from "framer-motion";

/**
 * Tela 2 — Buffer Reverso (Salvados / Off).
 *
 * Conceito: aqui NÃO se mede "risco de LOST" nem "novos LOST".
 * Por definição, todo pacote nesta tela já é lost (aging > 14d) —
 * é justamente por isso que foi categorizado como Off ou Salvado.
 *
 * O foco operacional aqui é:
 *  • antiguidade DENTRO do buffer reverso (faixas 14–21, 21–30, 30–60, 60+)
 *  • % sem identificação (bloqueio para leilão)
 *  • taxa estimada de expedição para leilão
 *  • pacote mais antigo (gargalo crônico)
 */
export function SalvadosScreen() {
  const { rows } = useDashboard();

  // Inclui SALVADOS (físico) + Off com ID (ambos já são lost por definição)
  const baseRows = useMemo(
    () =>
      rows.filter(
        (r) => r.buffer === "SALVADOS" || r.categoria === "Off com ID",
      ),
    [rows],
  );

  const { filters, setFilters, effective } = useFilters("rts.filters.reverse");
  const filtered = useMemo(
    () => applyFilters(baseRows, effective),
    [baseRows, effective],
  );
  const metrics = useMemo(
    () => computeReverseBufferMetrics(filtered),
    [filtered],
  );

  // Faixas de aging (gráfico)
  const ageBucketsData = [
    { faixa: "14–21d", value: metrics.ageBuckets.recent, fill: "var(--color-chart-3)" },
    { faixa: "21–30d", value: metrics.ageBuckets.aged, fill: "var(--color-chart-4)" },
    { faixa: "30–60d", value: metrics.ageBuckets.old, fill: "var(--color-warning)" },
    { faixa: "60+d", value: metrics.ageBuckets.critical, fill: "var(--color-destructive)" },
  ];

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

  // Tom dinâmico para a antiguidade
  const oldestTone =
    metrics.oldestDays >= 60
      ? "danger"
      : metrics.oldestDays >= 30
        ? "warning"
        : "default";

  const semIdTone =
    metrics.semIdPct > 30 ? "danger" : metrics.semId > 0 ? "warning" : "success";

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground"
      >
        <span className="font-semibold text-foreground">
          Buffer Reverso (Salvados + Off com ID)
        </span>
        <br />
        Todos os pacotes nesta tela já têm aging ≥ 14 dias — é exatamente por
        isso que foram categorizados como Off ou Salvado. O conceito de
        “risco de LOST” não se aplica aqui; o foco é{" "}
        <span className="text-foreground">antiguidade no buffer</span>,{" "}
        <span className="text-foreground">identificação</span> e{" "}
        <span className="text-foreground">taxa de expedição para leilão</span>.
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Total no buffer"
          value={metrics.total}
          icon={<Boxes className="h-5 w-5" />}
          hint={`${metrics.totalPacotes.toLocaleString("pt-BR")} pacotes (estim.)`}
        />
        <KpiCard
          index={1}
          label="Aging médio"
          value={`${metrics.avgAging.toFixed(1)}d`}
          icon={<Hourglass className="h-5 w-5" />}
          hint={`Mais antigo: ${metrics.oldestDays.toFixed(0)}d`}
          tone={oldestTone}
        />
        <KpiCard
          index={2}
          label="Sem identificação"
          value={metrics.semId}
          icon={<Tag className="h-5 w-5" />}
          tone={semIdTone}
          hint={
            metrics.semId > 0
              ? `${metrics.semIdPct.toFixed(0)}% — bloqueio para leilão`
              : "Tudo identificado"
          }
        />
        <KpiCard
          index={3}
          label="Taxa de expedição (estim.)"
          value={`${metrics.estimatedExpeditionRate.toFixed(1)}/d`}
          icon={<Truck className="h-5 w-5" />}
          hint="Saída média estimada para leilão"
        />
      </div>

      {/* Faixas de aging em destaque */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AgingBucket label="14–21 dias" value={metrics.ageBuckets.recent} tone="info" />
        <AgingBucket label="21–30 dias" value={metrics.ageBuckets.aged} tone="default" />
        <AgingBucket label="30–60 dias" value={metrics.ageBuckets.old} tone="warning" />
        <AgingBucket label="60+ dias" value={metrics.ageBuckets.critical} tone="danger" />
      </div>

      <FiltersBar
        rows={baseRows}
        value={filters}
        onChange={setFilters}
        hideBuffer
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Distribuição por antiguidade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageBucketsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="faixa" stroke="oklch(0.7 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {ageBucketsData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
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

        <ChartCard title="Entradas no buffer (últimos 30d)">
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

      <InsightsPanel rows={filtered} mode="reverse" />
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

const tooltipStyle: React.CSSProperties = {
  background: "oklch(0.16 0.012 30)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

const TONE_STYLES = {
  info: "border-accent-blue/40 text-accent-blue",
  default: "border-border/40 text-foreground",
  warning: "border-warning/40 text-warning",
  danger: "border-destructive/50 text-destructive",
} as const;

function AgingBucket({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE_STYLES;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-2xl border p-4 ${TONE_STYLES[tone]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-60">
        gaiolas
      </p>
    </motion.div>
  );
}
