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

export const PERFIL_PACKAGES: Record<Perfil, number> = {
  P: 175, // 150+
  M: 90,  // 31-149 (média)
  G: 15,  // 1-30
  "—": 0,
};

export const LOST_THRESHOLD_DAYS = 14;
export const RISK_THRESHOLD_DAYS = 10;
