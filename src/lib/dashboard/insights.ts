import type { Gaiola } from "./types";

export interface Insight {
  level: "info" | "warning" | "danger" | "success";
  title: string;
  description: string;
}

export function generateInsights(rows: Gaiola[]): Insight[] {
  const out: Insight[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Sem dados disponíveis",
      description: "Conecte uma planilha publicada para ver insights operacionais.",
    });
    return out;
  }

  const total = rows.length;
  const lost = rows.filter((r) => r.isLost);
  const atRisk = rows.filter((r) => r.isAtRisk && !r.isLost);
  const eha = rows.filter((r) => r.buffer === "EHA");
  const rts = rows.filter((r) => r.buffer === "RTS");
  const salvados = rows.filter((r) => r.buffer === "SALVADOS");

  // 1. LOST
  if (lost.length > 0) {
    const pacotesPerdidos = lost.reduce((s, r) => s + r.estimatedPackages, 0);
    out.push({
      level: "danger",
      title: `${lost.length} gaiola(s) em status LOST`,
      description: `Aging acima de 14 dias detectado, com estimativa de ${pacotesPerdidos.toLocaleString("pt-BR")} pacotes em risco. Priorizar tratativa imediata.`,
    });
  }

  // 2. RISK
  if (atRisk.length > 0) {
    out.push({
      level: "warning",
      title: `${atRisk.length} gaiola(s) próximas do limite de LOST`,
      description: `Aging entre 10 e 14 dias. Acionar plano de reação para evitar promoção a LOST nas próximas 96 horas.`,
    });
  }

  // 3. Concentração por buffer
  const ehaShare = eha.length / total;
  const rtsShare = rts.length / total;
  if (ehaShare > 0.5) {
    out.push({
      level: "warning",
      title: "Acúmulo no buffer EHA",
      description: `${Math.round(ehaShare * 100)}% das gaiolas estão no EHA. Avalie redistribuição para o RTS para descongestionar a área.`,
    });
  } else if (rtsShare > 0.6) {
    out.push({
      level: "info",
      title: "Concentração no RTS",
      description: `${Math.round(rtsShare * 100)}% das gaiolas estão no RTS. Volume de tratativa acima do habitual.`,
    });
  }

  // 4. Perfil dominante
  const perfilCount: Record<string, number> = { P: 0, M: 0, G: 0 };
  rows.forEach((r) => {
    if (r.perfil in perfilCount) perfilCount[r.perfil]++;
  });
  const topPerfil = Object.entries(perfilCount).sort((a, b) => b[1] - a[1])[0];
  if (topPerfil && topPerfil[1] > 0) {
    out.push({
      level: "info",
      title: `Perfil dominante: ${topPerfil[0]}`,
      description: `${topPerfil[1]} gaiolas com perfil ${topPerfil[0]} (${Math.round((topPerfil[1] / total) * 100)}% do total).`,
    });
  }

  // 5. Gargalo por turno
  const turnoCount: Record<string, number> = {};
  rows.forEach((r) => {
    turnoCount[r.turno] = (turnoCount[r.turno] ?? 0) + 1;
  });
  const topTurno = Object.entries(turnoCount).sort((a, b) => b[1] - a[1])[0];
  if (topTurno && topTurno[0] !== "—") {
    out.push({
      level: "info",
      title: `Maior fluxo no turno ${topTurno[0]}`,
      description: `${topTurno[1]} gaiolas registradas. Considere reforço de equipe nesse turno.`,
    });
  }

  // 6. Salvados
  if (salvados.length > 0) {
    const semId = salvados.filter((r) => r.categoria === "Salvados sem ID").length;
    if (semId > 0) {
      out.push({
        level: "warning",
        title: `${semId} gaiola(s) de Salvados sem ID`,
        description: `Itens sem identificação requerem catalogação manual antes de seguirem para leilão.`,
      });
    } else {
      out.push({
        level: "success",
        title: "Salvados 100% identificados",
        description: `Todas as ${salvados.length} gaiolas de salvados estão com ID válido. Fluxo para leilão fluindo bem.`,
      });
    }
  }

  // 7. Tendência de acúmulo (mais antigas)
  const oldest = [...rows].sort((a, b) => b.agingDays - a.agingDays)[0];
  if (oldest && oldest.agingDays > 0) {
    out.push({
      level: oldest.isLost ? "danger" : oldest.isAtRisk ? "warning" : "info",
      title: `Gaiola mais antiga: ${oldest.codigo}`,
      description: `Está há ${oldest.agingDays.toFixed(1)} dia(s) na ${oldest.buffer} (rua ${oldest.rua}, perfil ${oldest.perfil}).`,
    });
  }

  return out;
}
