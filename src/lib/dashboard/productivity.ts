import Papa from "papaparse";
import { rowToGaiola } from "./parser";
import type { Gaiola, RawRow } from "./types";

/**
 * Productivity tab parser/fetcher.
 *
 * Uses the SAME column layout as the first tab (CODIGO, RUA, BUFFER,
 * CATEGORIA GAIOLA, PERFIL, DATA E HORA, TURNO) but reads from gid=1
 * (the second tab) of the published Google Sheet.
 *
 * Each row represents a gaiola PROCESSED at the given DATA E HORA, so this
 * tab is the historical log used to measure daily/shift productivity.
 */

/** Force the URL to point at the SECOND sheet/tab (gid=1). */
function forceSecondTab(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.searchParams.set("gid", "1");
    u.searchParams.set("single", "true");
    // Remove any cached gid that could conflict
    return u.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}gid=1&single=true`;
  }
}

/** Convert a Google Sheets pub/share URL into a CSV export URL for the 2nd tab. */
export function toProductivityCsvUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;
  if (url.includes("output=csv")) return forceSecondTab(url);
  const replaced = url.replace(/\/pubhtml(\?.*)?$/, "/pub?output=csv");
  if (replaced !== url) return forceSecondTab(replaced);
  if (url.endsWith("/pub")) return forceSecondTab(`${url}?output=csv`);
  if (url.includes("/pub?")) {
    const u = new URL(url);
    u.searchParams.set("output", "csv");
    return forceSecondTab(u.toString());
  }
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=1`;
  }
  return url;
}

export function parseProductivityCsv(csv: string, now: Date = new Date()): Gaiola[] {
  const result = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/\s+/g, " ").toUpperCase(),
  });
  return result.data
    .map((row, i) => rowToGaiola(row as RawRow, i, now))
    .filter((g): g is Gaiola => g !== null);
}
