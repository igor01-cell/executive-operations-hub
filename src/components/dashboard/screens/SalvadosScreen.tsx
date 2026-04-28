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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  Layers,
  Package,
  PackageOpen,
  Tag,
  Warehouse,
} from "lucide-react";
import { PERFIL_PACKAGES, type Gaiola } from "@/lib/dashboard/types";
import { motion } from "framer-motion";

/**
 * Tela 2 — Buffer de Salvados (foco: VOLUME para venda em LOTES).
 *
 * Conceito: todos os pacotes aqui têm aging ≥ 14d (já são "salvados/off").
 * Não se aplica risco de LOST. O foco é entender o VOLUME disponível
 * para estruturar lotes de venda/leilão dos gaylords.
 *
 * Eixos de análise:
 *  • Volume total de pacotes & quantidade de gaylords
 *  • Mix por perfil (P, M, G) → precificação do lote
 *  • Distribuição por rua → planejamento de picking
 *  • Top gaylords por volume → candidatos a lote único
 */
export function SalvadosScreen() {
  const { rows } = useDashboard();

  // Tela 2 trabalha EXCLUSIVAMENTE com as duas categorias de Salvados.
  // Ambas são vendidas da mesma forma; a única diferença é a presença
  // de etiqueta identificadora.
  const baseRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.categoria === "Salvados com ID" ||
          r.categoria === "Salvados sem ID",
      ),
    [rows],
  );

  const { filters, setFilters, effective } = useFilters("rts.filters.reverse");
  const filtered = useMemo(
    () => applyFilters(baseRows, effective),
    [baseRows, effective],
  );

  /* ──────────── métricas de volume ──────────── */
  const totals = useMemo(() => {
    const totalGaylords = filtered.length;
    const totalPacotes = filtered.reduce((s, r) => s + r.estimatedPackages, 0);
    const avgPorGaylord = totalGaylords ? totalPacotes / totalGaylords : 0;

    const perfilCount: Record<"P" | "M" | "G", number> = { P: 0, M: 0, G: 0 };
    const perfilPacotes: Record<"P" | "M" | "G", number> = { P: 0, M: 0, G: 0 };
    filtered.forEach((r) => {
      if (r.perfil === "P" || r.perfil === "M" || r.perfil === "G") {
        perfilCount[r.perfil]++;
        perfilPacotes[r.perfil] += r.estimatedPackages;
      }
    });

    const semId = filtered.filter((r) => r.categoria === "Salvados sem ID").length;
    const comId = filtered.filter((r) => r.categoria === "Salvados com ID").length;
    const comIdPct = totalGaylords ? (comId / totalGaylords) * 100 : 0;

    return {
      totalGaylords,
      totalPacotes,
      avgPorGaylord,
      perfilCount,
      perfilPacotes,
      semId,
      comId,
      comIdPct,
    };
  }, [filtered]);

  /* ──────────── gráfico: pacotes por perfil ──────────── */
  const perfilData = (["P", "M", "G"] as const).map((p) => ({
    perfil: p,
    gaylords: totals.perfilCount[p],
    pacotes: totals.perfilPacotes[p],
    fill:
      p === "P"
        ? "var(--color-primary)"
        : p === "M"
          ? "var(--color-accent-blue)"
          : "var(--color-warning)",
  }));

  /* ──────────── gráfico: distribuição por rua ──────────── */
  const ruaData = useMemo(() => {
    const map: Record<string, { rua: string; gaylords: number; pacotes: number }> = {};
    filtered.forEach((r) => {
      const k = r.rua && r.rua !== "—" ? r.rua : "S/Rua";
      if (!map[k]) map[k] = { rua: k, gaylords: 0, pacotes: 0 };
      map[k].gaylords++;
      map[k].pacotes += r.estimatedPackages;
    });
    return Object.values(map).sort((a, b) => b.pacotes - a.pacotes);
  }, [filtered]);

  /* ──────────── top gaylords por volume ──────────── */
  const topGaylords = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.estimatedPackages - a.estimatedPackages)
        .slice(0, 10),
    [filtered],
  );

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground"
      >
        <span className="font-semibold text-foreground">
          Buffer de Salvados — Análise de volume para montagem de lotes
        </span>
        <br />
        Todos os gaylords desta tela já têm aging ≥ 14 dias e foram classificados
        como Salvados. O foco aqui é{" "}
        <span className="text-foreground">volume comercial</span>: quantos
        pacotes existem por gaylord, qual o{" "}
        <span className="text-foreground">mix de perfis (P/M/G)</span> e como{" "}
        <span className="text-foreground">organizar lotes para venda/leilão</span>.
        Estimativa por perfil: P ≈ {PERFIL_PACKAGES.P} pcs · M ≈{" "}
        {PERFIL_PACKAGES.M} pcs · G ≈ {PERFIL_PACKAGES.G} pcs.
      </motion.div>

      {/* KPIs de volume */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Total de pacotes"
          value={totals.totalPacotes.toLocaleString("pt-BR")}
          icon={<Package className="h-5 w-5" />}
          hint="Volume total disponível para venda"
          tone="info"
        />
        <KpiCard
          index={1}
          label="Gaylords no buffer"
          value={totals.totalGaylords}
          icon={<Boxes className="h-5 w-5" />}
          hint={`Média de ${totals.avgPorGaylord.toFixed(0)} pcs/gaylord`}
        />
        <KpiCard
          index={2}
          label="Com identificação"
          value={totals.comId}
          icon={<Tag className="h-5 w-5" />}
          hint={`${totals.comIdPct.toFixed(0)}% do buffer possui etiqueta`}
          tone="success"
        />
        <KpiCard
          index={3}
          label="Sem identificação"
          value={totals.semId}
          icon={<Layers className="h-5 w-5" />}
          hint="Vendidos normalmente em lote, sem etiqueta"
        />
      </div>

      {/* Cards de perfil — destaque */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <PerfilCard
          perfil="P"
          gaylords={totals.perfilCount.P}
          pacotes={totals.perfilPacotes.P}
          tone="primary"
          hint={`~${PERFIL_PACKAGES.P} pcs/gaylord · ideal lote único`}
        />
        <PerfilCard
          perfil="M"
          gaylords={totals.perfilCount.M}
          pacotes={totals.perfilPacotes.M}
          tone="info"
          hint={`~${PERFIL_PACKAGES.M} pcs/gaylord · lote padrão`}
        />
        <PerfilCard
          perfil="G"
          gaylords={totals.perfilCount.G}
          pacotes={totals.perfilPacotes.G}
          tone="warning"
          hint={`~${PERFIL_PACKAGES.G} pcs/gaylord · consolidar`}
        />
      </div>

      <FiltersBar
        rows={baseRows}
        value={filters}
        onChange={setFilters}
        hideBuffer
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Pacotes por perfil */}
        <ChartCard title="Pacotes por perfil (P / M / G)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perfilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="perfil" stroke="oklch(0.7 0 0)" fontSize={12} />
              <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="pacotes" radius={[8, 8, 0, 0]}>
                {perfilData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
                <LabelList
                  dataKey="pacotes"
                  position="top"
                  fill="oklch(0.85 0 0)"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Mix de gaylords (donut) */}
        <ChartCard title="Mix de gaylords por perfil">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={perfilData}
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                dataKey="gaylords"
                nameKey="perfil"
                stroke="oklch(0.10 0 0)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {perfilData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Distribuição por rua */}
        <ChartCard title="Volume de pacotes por rua">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ruaData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis type="number" stroke="oklch(0.7 0 0)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="rua"
                stroke="oklch(0.7 0 0)"
                fontSize={11}
                width={60}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="pacotes"
                fill="var(--color-primary)"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top gaylords por volume — apoio a montagem de lote */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-2xl p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <PackageOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Top 10 gaylords por volume
            </h3>
            <p className="text-xs text-muted-foreground">
              Candidatos a lote único de alto valor — comece a montagem por aqui
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Código</th>
                <th className="pb-2 pr-3">Rua</th>
                <th className="pb-2 pr-3">Perfil</th>
                <th className="pb-2 pr-3">Categoria</th>
                <th className="pb-2 pr-3 text-right">Pacotes (estim.)</th>
              </tr>
            </thead>
            <tbody>
              {topGaylords.map((g, i) => (
                <tr
                  key={g.id}
                  className="border-b border-border/20 transition-colors hover:bg-background/30"
                >
                  <td className="py-2 pr-3 text-muted-foreground tabular-nums">
                    {i + 1}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{g.codigo}</td>
                  <td className="py-2 pr-3">{g.rua}</td>
                  <td className="py-2 pr-3">
                    <PerfilBadge perfil={g.perfil} />
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {g.categoria}
                  </td>
                  <td className="py-2 pr-3 text-right font-bold tabular-nums text-primary">
                    {g.estimatedPackages.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {topGaylords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Sem gaylords disponíveis com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <InsightsPanel rows={filtered} mode="salvados-lot" />
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

const PERFIL_TONE = {
  primary: "border-primary/40 text-primary",
  info: "border-accent-blue/40 text-accent-blue",
  warning: "border-warning/40 text-warning",
} as const;

function PerfilCard({
  perfil,
  gaylords,
  pacotes,
  tone,
  hint,
}: {
  perfil: "P" | "M" | "G";
  gaylords: number;
  pacotes: number;
  tone: keyof typeof PERFIL_TONE;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-2xl border p-5 ${PERFIL_TONE[tone]}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
            Perfil {perfil}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums opacity-70">
          {gaylords} gaylord{gaylords === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
        {pacotes.toLocaleString("pt-BR")}
      </p>
      <p className="text-[10px] uppercase tracking-wider opacity-60">
        pacotes (estim.)
      </p>
      <p className="mt-2 text-[11px] leading-snug opacity-75">{hint}</p>
    </motion.div>
  );
}

function PerfilBadge({ perfil }: { perfil: Gaiola["perfil"] }) {
  const map = {
    P: "bg-primary/15 text-primary border-primary/30",
    M: "bg-accent-blue/15 text-accent-blue border-accent-blue/30",
    G: "bg-warning/15 text-warning border-warning/30",
    "—": "bg-muted/20 text-muted-foreground border-border/40",
  } as const;
  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-2 text-xs font-bold ${map[perfil]}`}
    >
      {perfil}
    </span>
  );
}
