/** Local storage helpers for sheet URL & refresh interval. */
const URL_KEY = "rts_dashboard_sheet_url";
const REFRESH_KEY = "rts_dashboard_refresh_sec";

export const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjskf_bcAvlozuoG61KdPqfLa4nnka5hsqUtIq0hIEwEjGIvgkH0rvZ68TJllw6ufQjlRil71L6KZI/pubhtml";

export function getSheetUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SHEET_URL;
  return window.localStorage.getItem(URL_KEY) || DEFAULT_SHEET_URL;
}

export function setSheetUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(URL_KEY, url);
}

export function getRefreshSec(): number {
  if (typeof window === "undefined") return 60;
  const v = Number(window.localStorage.getItem(REFRESH_KEY));
  return Number.isFinite(v) && v > 0 ? v : 60;
}

export function setRefreshSec(sec: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, String(sec));
}
