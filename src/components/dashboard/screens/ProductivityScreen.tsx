import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CalendarDays,
  Loader2,
  Package,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useProductivityData } from "@/lib/dashboard/useProductivityData";
import { PERFIL_PACKAGES, type Gaiola } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

/**
 * Tela 4 — Produtividade Diária.
 * Lê a 2ª aba da planilha (gid=1) que contém o histórico de gaiolas
 * processadas. Visualizações focadas em:
 *  • Volume por dia/turno
 *  • Heatmap hora × dia (picos e vales)
 *  • Tendência temporal (linha + média móvel 7d)
 */

const TURNO_COLORS: Record<string, string> = {
  T1: "var(--color-primary)",
  T2: "var(--color-accent-blue)",
  T3: "var(--color-warning)",
};

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDateShort(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

export function ProductivityScreen() {
  const { rows, loading, error, lastUpdated } = useProductivityData();

  const valid = useMemo(
    () => rows.filter((r): r is Gaiola & { dataHora: Date } => !!r.dataHora),
    [rows],
  );

  /* ──────── KPIs ──────── */
  const kpis = useMemo(() => {
    const totalGaiolas = valid.length;
    const totalPacotes = valid.reduce((s, r) => s + r.estimatedPackages, 0);
    const dias = new Set(valid.map((r) => fmtDateKey(r.dataHora))).size;
    const mediaDiaria = dias ? totalGaiolas / dias : 0;
    const turnoCount: Record<string, number> = {};
    valid.forEach((r) => {
      turnoCount[r.turno] = (turnoCount[r.turno] ?? 0) + 1;
    });
    const topTurno =
      Object.entries(turnoCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { totalGaiolas, totalPacotes, dias, mediaDiaria, topTurno };
  }, [valid]);

  /* ──────── Volume por dia × turno (stacked) ──────── */
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; T1: number; T2: number; T3: number; total: number }>();
    valid.forEach((r) => {
      const k = fmtDateKey(r.dataHora);
      if (!map.has(k)) map.set(k, { date: k, T1: 0, T2: 0, T3: 0, total: 0 });
      const e = map.get(k)!;
      const t = r.turno as "T1" | "T2" | "T3";
      if (t === "T1" || t === "T2" || t === "T3") e[t]++;
      e.total++;
    });
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [valid]);

  /* ──────── Tendência: total + média móvel 7d ──────── */
  const trendData = useMemo(() => {
    return dailyData.map((d, i) => {
      const window = dailyData.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, x) => s + x.total, 0) / window.length;
      return { date: d.date, total: d.total, mm7: Math.round(avg * 10) / 10 };
    });
  }, [dailyData]);

  /* ──────── Heatmap hora × dia da semana ──────── */
  const heatmap = useMemo(() => {
    // 7 dias × 24 horas
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    valid.forEach((r) => {
      grid[r.dataHora.getDay()][r.dataHora.getHours()]++;
    });
    let max = 0;
    grid.forEach((row) => row.forEach((v) => (max = Math.max(max, v))));
    return { grid, max };
  }, [valid]);

  /* ──────── Distribuição por turno ──────── */
  const turnoData = useMemo(() => {
    const map: Record<string, number> = { T1: 0, T2: 0, T3: 0 };
    valid.forEach((r) => {
      if (r.turno in map) map[r.turno]++;
      else map[r.turno] = (map[r.turno] ?? 0) + 1;
    });
    return Object.entries(map).map(([turno, gaiolas]) => ({
      turno,
      gaiolas,
      fill: TURNO_COLORS[turno] ?? "var(--color-muted)",
    }));
  }, [valid]);

  if (loading && rows.length === 0) {
    return (
      <div className="glass flex items-center gap-3 rounded-2xl p-8 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Carregando dados de produtividade da 2ª aba…
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="glass rounded-2xl border border-destructive/40 p-6 text-sm">
        <p className="font-semibold text-destructive">Erro ao carregar 2ª aba</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Verifique se a 2ª aba foi publicada na web (Arquivo → Compartilhar →
          Publicar na web → selecionar a 2ª aba).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho explicativo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground"
      >
        <span className="font-semibold text-foreground">
          Produtividade Diária — histórico de processamento (2ª aba da planilha)
        </span>
        <br />
        Cada linha representa uma gaiola registrada em uma data/hora.
        Use os gráficos abaixo para identificar{" "}
        <span className="text-foreground">picos de demanda</span>, comparar{" "}
        <span className="text-foreground">turnos</span> e acompanhar a{" "}
        <span className="text-foreground">tendência semanal</span>.
        {lastUpdated && (
          <span className="block mt-1 text-[10px] opacity-70">
            Última leitura: {lastUpdated.toLocaleString("pt-BR")}
          </span>
        )}
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Gaiolas processadas"
          value={kpis.totalGaiolas.toLocaleString("pt-BR")}
          icon={<Activity className="h-5 w-5" />}
          hint={`${kpis.dias} ${kpis.dias === 1 ? "dia" : "dias"} de operação`}
        />
        <KpiCard
          index={1}
          label="Pacotes estimados"
          value={kpis.totalPacotes.toLocaleString("pt-BR")}
          icon={<Package className="h-5 w-5" />}
          hint={`P=${PERFIL_PACKAGES.P} · M=${PERFIL_PACKAGES.M} · G=${PERFIL_PACKAGES.G}`}
          tone="info"
        />
        <KpiCard
          index={2}
          label="Média gaiolas/dia"
          value={kpis.mediaDiaria.toFixed(1)}
          icon={<TrendingUp className="h-5 w-5" />}
          hint="Throughput médio"
          tone="success"
        />
        <KpiCard
          index={3}
          label="Turno mais produtivo"
          value={kpis.topTurno}
          icon={<Trophy className="h-5 w-5" />}
          hint="Maior nº de gaiolas no período"
          tone="warning"
        />
      </div>

      {/* Volume por dia × turno (stacked) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-2xl p-4 sm:p-5"
      >
        <header className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Volume por dia × turno
          </h2>
          <span className="ml-auto text-[10px] text-muted-foreground">
            Empilhado (T1 / T2 / T3)
          </span>
        </header>
        <div className="h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDateShort}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
              />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(l) => fmtDateShort(String(l))}
              />
              <Bar dataKey="T1" stackId="a" fill={TURNO_COLORS.T1} radius={[0, 0, 0, 0]} />
              <Bar dataKey="T2" stackId="a" fill={TURNO_COLORS.T2} />
              <Bar dataKey="T3" stackId="a" fill={TURNO_COLORS.T3} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Legend />
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tendência */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="glass min-w-0 rounded-2xl p-3 sm:p-5 lg:col-span-2"
        >
          <header className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Tendência temporal
            </h2>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Diário + média móvel 7d
            </span>
          </header>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDateShort}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => fmtDateShort(String(l))}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Gaiolas/dia"
                />
                <Line
                  type="monotone"
                  dataKey="mm7"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Média móvel 7d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Distribuição por turno */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="glass min-w-0 rounded-2xl p-3 sm:p-5"
        >
          <header className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-blue" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Por turno
            </h2>
          </header>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="turno" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="gaiolas" radius={[6, 6, 0, 0]}>
                  {turnoData.map((d) => (
                    <Cell key={d.turno} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* Heatmap hora × dia da semana */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="glass rounded-2xl p-4 sm:p-5"
      >
        <header className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Heatmap hora × dia da semana
          </h2>
          <span className="ml-auto text-[10px] text-muted-foreground">
            Identifica picos e vales operacionais
          </span>
        </header>
        <Heatmap grid={heatmap.grid} max={heatmap.max} />
      </motion.section>
    </div>
  );
}

/* ────────── Heatmap visual (CSS grid) ────────── */
function Heatmap({ grid, max }: { grid: number[][]; max: number }) {
  // Color intensity is computed from max so the scale is relative
  const cell = (v: number) => {
    if (v === 0) return "bg-background/30";
    const pct = v / max;
    if (pct > 0.75) return "bg-primary/90 text-primary-foreground";
    if (pct > 0.5) return "bg-primary/70 text-primary-foreground";
    if (pct > 0.25) return "bg-primary/45 text-foreground";
    return "bg-primary/20 text-foreground";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* header hours */}
        <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-0.5">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-center text-[9px] font-medium text-muted-foreground"
            >
              {h}
            </div>
          ))}
        </div>
        {grid.map((row, dayIdx) => (
          <div
            key={dayIdx}
            className="mt-0.5 grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-0.5"
          >
            <div className="flex items-center justify-end pr-1.5 text-[10px] font-semibold text-muted-foreground">
              {WEEK_LABELS[dayIdx]}
            </div>
            {row.map((v, h) => (
              <div
                key={h}
                title={`${WEEK_LABELS[dayIdx]} ${h}h — ${v} gaiolas`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[3px] text-[9px] font-bold tabular-nums transition-transform hover:scale-110",
                  cell(v),
                )}
              >
                {v > 0 ? v : ""}
              </div>
            ))}
          </div>
        ))}
        {/* legend */}
        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Menos</span>
          {[0.2, 0.45, 0.7, 0.9].map((p) => (
            <span
              key={p}
              className="h-3 w-5 rounded-[3px]"
              style={{ background: `color-mix(in oklab, var(--color-primary) ${p * 100}%, transparent)` }}
            />
          ))}
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
      {(["T1", "T2", "T3"] as const).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: TURNO_COLORS[t] }}
          />
          Turno {t}
        </span>
      ))}
    </div>
  );
}
