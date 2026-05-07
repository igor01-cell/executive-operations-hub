import Papa from "papaparse";
import {
  type BufferType,
  type Categoria,
  type Gaiola,
  type Perfil,
  type RawRow,
  LOST_THRESHOLD_DAYS,
  PERFIL_PACKAGES,
  RISK_THRESHOLD_DAYS,
} from "./types";

const normalize = (s: string | undefined | null): string =>
  (s ?? "").toString().trim();

const upper = (s: string | undefined | null): string => normalize(s).toUpperCase();

function parseBuffer(v: string | undefined): BufferType {
  const u = upper(v);
  if (u.includes("SALVAD")) return "SALVADOS";
  if (u.includes("EHA")) return "EHA";
  return "RTS";
}

function parseCategoria(v: string | undefined): Categoria {
  const u = upper(v);
  if (!u) return "Outros";
  if (u.includes("AVARIA")) return "Avaria";
  if (u.includes("TRATATIV")) return "Tratativas";
  if (u.includes("SALVAD") && u.includes("SEM")) return "Salvados sem ID";
  if (u.includes("SALVAD")) return "Salvados com ID";
  if (u.includes("OFF") && u.includes("SEM")) return "Off sem ID";
  if (u.includes("OFF") && u.includes("ID")) return "Off com ID";
  return "Outros";
}

function parsePerfil(v: string | undefined): Perfil {
  const u = upper(v);
  if (u === "P" || u === "M" || u === "G") return u as Perfil;
  return "—";
}

/** Parse "2026/02/23 22:13:57", "2026-02-23 22:13", "23/02/2026 22:13" or ISO. */
function parseDateBR(v: string | undefined): Date | null {
  const s = normalize(v);
  if (!s) return null;

  // yyyy/mm/dd or yyyy-mm-dd [hh:mm[:ss]]  (Google Sheets default format)
  const ymd = s.match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (ymd) {
    const [, yyyy, mm, dd, hh = "0", mi = "0", ss = "0"] = ymd;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // dd/mm/yyyy [hh:mm[:ss]]  (BR format)
  const dmy = s.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (dmy) {
    const [, dd, mm, yyyy, hh = "0", mi = "0", ss = "0"] = dmy;
    const year = yyyy.length === 2 ? 2000 + Number(yyyy) : Number(yyyy);
    const d = new Date(
      year,
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Fallback: native Date parser (true ISO strings)
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Extract trailing numeric portion of "RTS01" / "Ru10" / "eha23" / "1" / "15" */
function extractRuaNum(v: string): number | null {
  const m = v.match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/** Map a rua string to (rua 1..10, posicao 1..7) within a 70-cell buffer. */
function mapToGrid(ruaNum: number | null): { rua: number | null; pos: number | null } {
  if (ruaNum == null) return { rua: null, pos: null };
  // We use modular mapping so any sequential numbering fills the 10x7 grid.
  const idx = ((ruaNum - 1) % 70 + 70) % 70;
  return {
    rua: Math.floor(idx / 7) + 1,
    pos: (idx % 7) + 1,
  };
}

export function rowToGaiola(row: RawRow, idx: number, now: Date): Gaiola | null {
  const codigo = normalize(row.CODIGO);
  const rua = normalize(row.RUA);
  const bufferRaw = normalize(row.BUFFER);

  // Skip totally empty rows
  if (!codigo && !rua && !bufferRaw) return null;

  const buffer = parseBuffer(bufferRaw);
  const categoria = parseCategoria(row["CATEGORIA GAIOLA"]);
  const perfil = parsePerfil(row.PERFIL);
  const dataHora = parseDateBR(row["DATA E HORA"]);
  const turno = normalize(row.TURNO) || "—";

  const ruaNum = rua ? extractRuaNum(rua) : null;
  const grid = mapToGrid(ruaNum);

  let agingHours = 0;
  let agingDays = 0;
  if (dataHora) {
    agingHours = Math.max(0, (now.getTime() - dataHora.getTime()) / 36e5);
    agingDays = agingHours / 24;
  }

  return {
    id: `${codigo || "—"}-${rua || "—"}-${idx}`,
    codigo: codigo || "—",
    rua: rua || "—",
    ruaNum,
    posicao: grid.pos,
    buffer,
    categoria,
    perfil,
    dataHora,
    turno,
    agingDays,
    agingHours,
    isLost: agingDays > LOST_THRESHOLD_DAYS,
    isAtRisk: agingDays > RISK_THRESHOLD_DAYS,
    estimatedPackages: PERFIL_PACKAGES[perfil],
  };
}

export function parseCsv(csv: string, now: Date = new Date()): Gaiola[] {
  const result = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/\s+/g, " ").toUpperCase(),
  });
  return result.data
    .map((row, i) => rowToGaiola(row as RawRow, i, now))
    .filter((g): g is Gaiola => g !== null);
}

/**
 * Convert a Google Sheets "publish to web" URL into a CSV export URL.
 * Accepts:
 *  - https://docs.google.com/spreadsheets/d/e/{KEY}/pubhtml
 *  - https://docs.google.com/spreadsheets/d/e/{KEY}/pub
 *  - direct CSV URLs (returned unchanged)
 */
/**
 * Force the URL to point at the FIRST sheet/tab only (gid=0).
 * All dashboard calculations use only the first tab of the spreadsheet.
 */
function forceFirstTab(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("gid", "0");
    u.searchParams.set("single", "true");
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}gid=0&single=true`;
  }
}

export function toCsvUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;
  if (url.includes("output=csv")) return forceFirstTab(url);
  // /pubhtml -> /pub?output=csv ; /pub -> /pub?output=csv
  const replaced = url.replace(/\/pubhtml(\?.*)?$/, "/pub?output=csv");
  if (replaced !== url) return forceFirstTab(replaced);
  if (url.endsWith("/pub")) return forceFirstTab(`${url}?output=csv`);
  if (url.includes("/pub?")) {
    const u = new URL(url);
    u.searchParams.set("output", "csv");
    return forceFirstTab(u.toString());
  }
  // Standard share URL -> export endpoint (gid=0 = first tab)
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=0`;
  }
  return url;
}
