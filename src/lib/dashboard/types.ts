export type BufferType = "RTS" | "EHA" | "SALVADOS";
export type Perfil = "P" | "M" | "G" | "—";
export type Categoria =
  | "Online"
  | "Off com ID"
  | "EHA"
  | "Salvados com ID"
  | "Salvados sem ID"
  | "Outros";

export interface RawRow {
  CODIGO?: string;
  RUA?: string;
  BUFFER?: string;
  "CATEGORIA GAIOLA"?: string;
  PERFIL?: string;
  "DATA E HORA"?: string;
  TURNO?: string;
}

export interface Gaiola {
  id: string;          // unique id
  codigo: string;
  rua: string;
  ruaNum: number | null; // numeric extracted (1..10)
  posicao: number | null; // numeric position (1..7) — derived from rua suffix if available
  buffer: BufferType;
  categoria: Categoria;
  perfil: Perfil;
  dataHora: Date | null;
  turno: string;
  agingDays: number;     // dias desde dataHora
  agingHours: number;
  isLost: boolean;       // aging > 14 dias
  isAtRisk: boolean;     // aging > 10 dias (warning)
  estimatedPackages: number; // estimativa pelo perfil
}

/**
 * Faixas oficiais de classificação por quantidade de produtos no gaylord.
 *   • P (Pequeno): ≥ 150 produtos          → volume alto
 *   • M (Médio):   31 a 149 produtos       → volume intermediário
 *   • G (Grande):  1 a 30 produtos         → volume baixo
 *
 * Sem sobreposição. Valores nulos / 0 / negativos caem em "—".
 */
export const PERFIL_RANGES = {
  P: { min: 150, max: Infinity, label: "150+ produtos" },
  M: { min: 31, max: 149, label: "31 a 149 produtos" },
  G: { min: 1, max: 30, label: "1 a 30 produtos" },
} as const;

/**
 * Valor representativo de pacotes usado em todos os cálculos do dashboard.
 * Adotamos o limite inferior (P) e a mediana (M, G) — estimativa conservadora.
 */
export const PERFIL_PACKAGES: Record<Perfil, number> = {
  P: 150, // limite inferior da faixa "150+"
  M: 90,  // mediana de 31–149
  G: 15,  // mediana de 1–30
  "—": 0,
};

/**
 * Classifica uma quantidade de produtos no perfil correspondente.
 * Retorna "—" para valores inválidos (null, undefined, 0, negativos, NaN).
 */
export function classifyPerfil(qty: number | null | undefined): Perfil {
  if (qty == null || !Number.isFinite(qty) || qty < 1) return "—";
  if (qty >= PERFIL_RANGES.P.min) return "P";
  if (qty >= PERFIL_RANGES.M.min) return "M";
  return "G";
}

export const LOST_THRESHOLD_DAYS = 14;
export const RISK_THRESHOLD_DAYS = 10;
