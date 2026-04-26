import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FiltersBar, applyFilters, initialFilters } from "@/components/dashboard/FiltersBar";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import {
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
import { Boxes, Hourglass, Package, Tag } from "lucide-react";

export function SalvadosScreen() {
  const { rows } = useDashboard();
  const [filters, setFilters] = useState(initialFilters);

  const baseRows = useMemo(
    () => rows.filter((r) => r.buffer === "SALVADOS"),
    [rows],
  );
  const filtered = useMemo(() => applyFilters(baseRows, filters), [baseRows, filters]);

  const totalGaiolas = filtered.length;
  const totalPacotes = filtered.reduce((s, r) => s + r.estimatedPackages, 0);
  const semId = filtered.filter((r) => r.categoria === "Salvados sem ID").length;
  const avgAging = filtered.length
    ? filtered.reduce((s, r) => s + r.agingDays, 0) / filtered.length
    : 0;

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
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ][i % 5],
  }));

  // Por turno
  const turnoMap = filtered.reduce<Record<string, number>>((acc, r) => {
    acc[r.turno] = (acc[r.turno] ?? 0) + 1;
    return acc;
  }, {});
  const turnoData = Object.entries(turnoMap)
    .filter(([k]) => k && k !== "—")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gaiolas em Salvados"
          value={totalGaiolas}
          icon={<Boxes className="h-5 w-5" />}
          hint="Buffer reverso"
        />
        <KpiCard
          label="Pacotes (estim.)"
          value={totalPacotes.toLocaleString("pt-BR")}
          icon={<Package className="h-5 w-5" />}
          hint="Inventário para leilão"
          tone="warning"
        />
        <KpiCard
          label="Sem identificação"
          value={semId}
          icon={<Tag className="h-5 w-5" />}
          tone={semId > 0 ? "warning" : "success"}
          hint="Requer catalogação manual"
        />
        <KpiCard
          label="Aging médio"
          value={`${avgAging.toFixed(1)}d`}
          icon={<Hourglass className="h-5 w-5" />}
          hint="Tempo médio na área"
          tone={avgAging > 10 ? "danger" : avgAging > 5 ? "warning" : "default"}
        />
      </div>

      <FiltersBar rows={baseRows} value={filters} onChange={setFilters} hideBuffer />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
            Distribuição por perfil
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="perfil" stroke="oklch(0.7 0 0)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.012 30)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="gaiolas" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
            Por categoria
          </h3>
          <div className="h-56">
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
                >
                  {catData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.012 30)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {catData.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.fill }}
                />
                <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                <span className="font-mono font-semibold">{c.value}</span>
              </div>
            ))}
            {catData.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem dados</p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
            Entradas por turno
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis type="number" stroke="oklch(0.7 0 0)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.7 0 0)"
                  fontSize={11}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.012 30)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <InsightsPanel rows={filtered} />
    </div>
  );
}
