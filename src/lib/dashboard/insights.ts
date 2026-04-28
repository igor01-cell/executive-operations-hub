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
      description:
        "Conecte uma planilha publicada para ver insights operacionais em tempo real.",
    });
    return out;
  }

  const total = rows.length;
  const lost = rows.filter((r) => r.isLost);
  const atRisk = rows.filter((r) => r.isAtRisk && !r.isLost);
  const eha = rows.filter((r) => r.buffer === "EHA");
  const rts = rows.filter((r) => r.buffer === "RTS");
  const salvados = rows.filter((r) => r.buffer === "SALVADOS");

  // 1. LOST — alto risco operacional
  if (lost.length > 0) {
    const pct = (lost.length / total) * 100;
    const pacotesPerdidos = lost.reduce((s, r) => s + r.estimatedPackages, 0);
    out.push({
      level: "danger",
      title: `Alto risco operacional · ${lost.length} gaiola(s) em LOST`,
      description: `${pct.toFixed(0)}% do volume monitorado está acima de 14 dias, somando aprox. ${pacotesPerdidos.toLocaleString("pt-BR")} pacotes. Ação imediata recomendada.`,
    });
  }

  // 2. RISK — tendência de crescimento de LOST
  if (atRisk.length > 0) {
    out.push({
      level: "warning",
      title: `Tendência de crescimento de LOST · ${atRisk.length} gaiola(s)`,
      description: `Aging entre 10 e 14 dias. Promoção a LOST projetada para as próximas 96 horas se não houver tratativa.`,
    });
  }

  // 3. Concentração por buffer (gargalo)
  const ehaShare = eha.length / total;
  const rtsShare = rts.length / total;
  if (ehaShare > 0.5) {
    out.push({
      level: "warning",
      title: "Gargalo identificado no buffer EHA",
      description: `${Math.round(ehaShare * 100)}% das gaiolas estão concentradas no EHA. Avalie redistribuição para o RTS para descongestionar a área.`,
    });
  } else if (rtsShare > 0.6) {
    out.push({
      level: "info",
      title: "Concentração elevada no RTS",
      description: `${Math.round(rtsShare * 100)}% das gaiolas estão no RTS. Volume de tratativa acima do habitual.`,
    });
  }

  // 4. Acúmulo de Salvados (backlog)
  if (salvados.length > 0) {
    const semId = salvados.filter((r) => r.categoria === "Salvados sem ID").length;
    const oldSalvados = salvados.filter((r) => r.agingDays > 21).length;
    if (oldSalvados > 0) {
      out.push({
        level: "danger",
        title: `${oldSalvados} salvado(s) com mais de 21 dias`,
        description: `Acúmulo crônico no buffer reverso indica baixa taxa de expedição para leilão. Revisar fluxo de saída.`,
      });
    }
    if (semId > 0) {
      out.push({
        level: "warning",
        title: `${semId} salvado(s) sem ID`,
        description: `Itens sem identificação requerem catalogação manual antes de seguirem para leilão.`,
      });
    } else if (salvados.length > 0) {
      out.push({
        level: "success",
        title: "Salvados 100% identificados",
        description: `Todas as ${salvados.length} gaiolas de salvados estão com ID válido. Fluxo para leilão fluindo bem.`,
      });
    }
  }

  // 5. Perfil dominante
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

  // 6. Gargalo por turno
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

  // 7. Concentração por rua (hot spot)
  const ruaCount: Record<string, number> = {};
  rows.forEach((r) => {
    ruaCount[r.rua] = (ruaCount[r.rua] ?? 0) + 1;
  });
  const topRua = Object.entries(ruaCount)
    .filter(([k]) => k && k !== "—")
    .sort((a, b) => b[1] - a[1])[0];
  if (topRua && topRua[1] >= 3) {
    out.push({
      level: "info",
      title: `Hot spot detectado: rua ${topRua[0]}`,
      description: `${topRua[1]} gaiolas concentradas em uma única rua. Verificar se há gargalo de fluxo.`,
    });
  }

  // 8. Gaiola mais antiga
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

/**
 * KPIs do buffer reverso (Salvados / Off).
 *
 * NOTA: Aqui NÃO usamos o conceito de "risco de LOST" nem "novos LOST".
 * Por definição, todo pacote categorizado como Off ou Salvado já está
 * lost (aging > 14d) — ele só chega nesse buffer porque virou lost.
 * O que importa nessa tela é antiguidade DENTRO do buffer reverso,
 * identificação e taxa de saída para leilão.
 */
export interface ReverseBufferMetrics {
  total: number;
  totalPacotes: number;
  /** Aging médio (dias). Todos já são ≥14d, então o piso real é 14. */
  avgAging: number;
  /** Gaiola mais antiga (dias). */
  oldestDays: number;
  /** Faixas de antiguidade dentro do buffer reverso. */
  ageBuckets: {
    /** 14–21 dias */ recent: number;
    /** 21–30 dias */ aged: number;
    /** 30–60 dias */ old: number;
    /** > 60 dias  */ critical: number;
  };
  /** Itens sem identificação (Salvados sem ID). */
  semId: number;
  /** % sem ID. */
  semIdPct: number;
  /** Estimativa de saída diária baseada nos últimos 7 dias de movimentação. */
  estimatedExpeditionRate: number;
}

export function computeReverseBufferMetrics(
  rows: Gaiola[],
  now: Date = new Date(),
): ReverseBufferMetrics {
  void now;
  const total = rows.length;
  const totalPacotes = rows.reduce((s, r) => s + r.estimatedPackages, 0);
  const avgAging = total
    ? rows.reduce((s, r) => s + r.agingDays, 0) / total
    : 0;
  const oldestDays = rows.reduce((max, r) => Math.max(max, r.agingDays), 0);

  const ageBuckets = {
    recent: rows.filter((r) => r.agingDays >= 14 && r.agingDays < 21).length,
    aged: rows.filter((r) => r.agingDays >= 21 && r.agingDays < 30).length,
    old: rows.filter((r) => r.agingDays >= 30 && r.agingDays < 60).length,
    critical: rows.filter((r) => r.agingDays >= 60).length,
  };

  const semId = rows.filter((r) => r.categoria === "Salvados sem ID").length;
  const semIdPct = total ? (semId / total) * 100 : 0;

  // Taxa de saída estimada: itens "novos" no buffer (aging entre 14 e 21d)
  // representam quem chegou nos últimos 7 dias. Usamos como proxy de fluxo.
  const recent7d = rows.filter(
    (r) => r.agingDays >= 14 && r.agingDays < 21,
  ).length;
  const estimatedExpeditionRate = recent7d / 7;

  return {
    total,
    totalPacotes,
    avgAging,
    oldestDays,
    ageBuckets,
    semId,
    semIdPct,
    estimatedExpeditionRate,
  };
}

/**
 * Insights focados no buffer reverso (Salvados / Off).
 * NÃO menciona "risco de LOST" nem "novos LOST" — todos os itens aqui
 * já são lost por definição. O foco é antiguidade, identificação e
 * gargalos de expedição para leilão.
 */
export function generateReverseInsights(rows: Gaiola[]): Insight[] {
  const out: Insight[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Buffer reverso vazio",
      description:
        "Nenhum pacote no buffer reverso com os filtros atuais.",
    });
    return out;
  }

  const m = computeReverseBufferMetrics(rows);

  // 1. Concentração crítica (>60d)
  if (m.ageBuckets.critical > 0) {
    out.push({
      level: "danger",
      title: `${m.ageBuckets.critical} pacote(s) há mais de 60 dias`,
      description: `Antiguidade crítica no buffer reverso. Priorizar expedição imediata para leilão para liberar espaço físico.`,
    });
  }

  // 2. Concentração 30–60d
  if (m.ageBuckets.old > 0) {
    out.push({
      level: "warning",
      title: `${m.ageBuckets.old} pacote(s) entre 30 e 60 dias`,
      description: `Antiguidade elevada. Revisar ciclo de saída para evitar acúmulo crônico.`,
    });
  }

  // 3. Identificação
  if (m.semId > 0) {
    out.push({
      level: m.semIdPct > 30 ? "danger" : "warning",
      title: `${m.semId} pacote(s) sem ID (${m.semIdPct.toFixed(0)}%)`,
      description: `Itens sem identificação não podem seguir para leilão. Priorizar catalogação manual.`,
    });
  } else {
    out.push({
      level: "success",
      title: "Buffer 100% identificado",
      description: `Todos os ${m.total} pacotes possuem ID válido. Fluxo para leilão desbloqueado.`,
    });
  }

  // 4. Aging médio
  out.push({
    level: m.avgAging > 30 ? "warning" : "info",
    title: `Aging médio: ${m.avgAging.toFixed(1)} dias`,
    description: `Pacote mais antigo está há ${m.oldestDays.toFixed(0)} dia(s) no buffer.`,
  });

  // 5. Taxa de saída
  if (m.estimatedExpeditionRate < 1 && m.total > 5) {
    out.push({
      level: "warning",
      title: "Baixa taxa de expedição",
      description: `Estimativa de saída de apenas ${m.estimatedExpeditionRate.toFixed(1)} pacote(s)/dia. Revisar fluxo de leilão.`,
    });
  } else if (m.estimatedExpeditionRate >= 1) {
    out.push({
      level: "info",
      title: `Saída estimada: ${m.estimatedExpeditionRate.toFixed(1)}/dia`,
      description: `Baseado nos pacotes que entraram no buffer nos últimos 7 dias.`,
    });
  }

  return out;
}

/**
 * Insights focados em VOLUME e MONTAGEM DE LOTES para venda/leilão.
 * Substitui a lógica de risco por uma análise comercial dos gaylords.
 */
export function generateSalvadosLotInsights(rows: Gaiola[]): Insight[] {
  const out: Insight[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Sem gaylords no buffer",
      description: "Nenhum gaylord disponível para montagem de lotes com os filtros atuais.",
    });
    return out;
  }

  const totalGaylords = rows.length;
  const totalPacotes = rows.reduce((s, r) => s + r.estimatedPackages, 0);
  const avgPorGaylord = totalPacotes / totalGaylords;

  // 1. Volume total disponível para venda
  out.push({
    level: "success",
    title: `${totalPacotes.toLocaleString("pt-BR")} pacotes disponíveis para lote`,
    description: `Distribuídos em ${totalGaylords} gaylord(s), média de ${avgPorGaylord.toFixed(0)} pacotes por gaylord.`,
  });

  // 2. Mix de perfil (P/M/G) — crítico para precificação do lote
  const perfilCount: Record<string, number> = { P: 0, M: 0, G: 0 };
  const perfilPacotes: Record<string, number> = { P: 0, M: 0, G: 0 };
  rows.forEach((r) => {
    if (r.perfil in perfilCount) {
      perfilCount[r.perfil]++;
      perfilPacotes[r.perfil] += r.estimatedPackages;
    }
  });
  const perfilTop = Object.entries(perfilCount).sort((a, b) => b[1] - a[1])[0];
  if (perfilTop && perfilTop[1] > 0) {
    const pct = Math.round((perfilTop[1] / totalGaylords) * 100);
    out.push({
      level: "info",
      title: `Mix dominante: perfil ${perfilTop[0]} (${pct}%)`,
      description: `P: ${perfilCount.P} gaylords (${perfilPacotes.P.toLocaleString("pt-BR")} pcs) · M: ${perfilCount.M} (${perfilPacotes.M.toLocaleString("pt-BR")} pcs) · G: ${perfilCount.G} (${perfilPacotes.G.toLocaleString("pt-BR")} pcs).`,
    });
  }

  // 3. Lotes "cheios" prontos para venda (perfil P alto volume)
  const lotesCheios = rows.filter((r) => r.perfil === "P").length;
  if (lotesCheios >= 3) {
    out.push({
      level: "success",
      title: `${lotesCheios} gaylord(s) de alto volume (perfil P)`,
      description: `Cada um ~175 pacotes. Recomendado vender como lote único — maior margem por gaylord.`,
    });
  }

  // 4. Gaylords pequenos — consolidar
  const lotesPequenos = rows.filter((r) => r.perfil === "G").length;
  if (lotesPequenos >= 2) {
    const totalP = perfilPacotes.G;
    out.push({
      level: "warning",
      title: `${lotesPequenos} gaylord(s) de baixo volume (perfil G)`,
      description: `Somam apenas ~${totalP} pacotes. Considere consolidar em um lote misto para otimizar logística de venda.`,
    });
  }

  // 5. Concentração por rua (planejamento de picking p/ leilão)
  const ruaCount: Record<string, { gaylords: number; pacotes: number }> = {};
  rows.forEach((r) => {
    if (!r.rua || r.rua === "—") return;
    if (!ruaCount[r.rua]) ruaCount[r.rua] = { gaylords: 0, pacotes: 0 };
    ruaCount[r.rua].gaylords++;
    ruaCount[r.rua].pacotes += r.estimatedPackages;
  });
  const topRua = Object.entries(ruaCount).sort((a, b) => b[1].pacotes - a[1].pacotes)[0];
  if (topRua) {
    out.push({
      level: "info",
      title: `Rua ${topRua[0]} concentra maior volume`,
      description: `${topRua[1].gaylords} gaylord(s) e ~${topRua[1].pacotes.toLocaleString("pt-BR")} pacotes. Picking otimizado começando por essa rua.`,
    });
  }

  // 6. Sugestão de lote consolidado
  const sugestaoLote = Math.ceil(totalPacotes / 500); // ~500 pcs por lote comercial
  if (totalPacotes >= 500) {
    out.push({
      level: "success",
      title: `Sugestão: ${sugestaoLote} lote(s) comercial(is) de ~500 pacotes`,
      description: `Volume atual permite estruturar ${sugestaoLote} lote(s) padrão para leilão, balanceando mix P/M/G.`,
    });
  }

  // 7. Identificação (bloqueio para leilão)
  const semId = rows.filter((r) => r.categoria === "Salvados sem ID").length;
  if (semId > 0) {
    const pct = (semId / totalGaylords) * 100;
    out.push({
      level: pct > 30 ? "danger" : "warning",
      title: `${semId} gaylord(s) sem ID (${pct.toFixed(0)}%)`,
      description: `Bloqueados para venda. Priorizar catalogação para liberar volume comercial.`,
    });
  }

  return out;
}

/* Backwards-compat alias (legacy callers). */
export const computeSalvadosMetrics = computeReverseBufferMetrics;
export type SalvadosMetrics = ReverseBufferMetrics;

/** Dados para gráfico de evolução temporal (entradas por dia). */
export function buildTimeline(rows: Gaiola[], days = 30) {
  const buckets = new Map<string, number>();
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  rows.forEach((r) => {
    if (!r.dataHora) return;
    const ageDays = (now - r.dataHora.getTime()) / 86400000;
    if (ageDays < 0 || ageDays >= days) return;
    const d = r.dataHora;
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}
