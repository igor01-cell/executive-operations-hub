import { useCallback, useEffect, useRef, useState } from "react";
import { parseCsv, toCsvUrl } from "./parser";
import { DEFAULT_SHEET_URL, getRefreshSec, getSheetUrl } from "./store";
import type { Gaiola } from "./types";

interface State {
  rows: Gaiola[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  sheetUrl: string;
  refreshSec: number;
}

export function useDashboardData() {
  const [state, setState] = useState<State>({
    rows: [],
    loading: true,
    error: null,
    lastUpdated: null,
    sheetUrl: DEFAULT_SHEET_URL,
    refreshSec: 60,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (urlOverride?: string) => {
    const url = urlOverride ?? getSheetUrl();
    setState((s) => ({ ...s, loading: true, error: null, sheetUrl: url }));
    try {
      const csvUrl = toCsvUrl(url);
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseCsv(text, new Date());
      setState((s) => ({
        ...s,
        rows,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar dados",
      }));
    }
  }, []);

  // Initial load + setup refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = getSheetUrl();
    const refreshSec = getRefreshSec();
    setState((s) => ({ ...s, sheetUrl: url, refreshSec }));
    void fetchData(url);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      void fetchData();
    }, refreshSec * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRefresh = useCallback((sec: number) => {
    setState((s) => ({ ...s, refreshSec: sec }));
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      void fetchData();
    }, sec * 1000);
  }, [fetchData]);

  return {
    ...state,
    refresh: () => fetchData(),
    setUrlAndRefresh: (url: string) => fetchData(url),
    setRefreshInterval: updateRefresh,
  };
}
