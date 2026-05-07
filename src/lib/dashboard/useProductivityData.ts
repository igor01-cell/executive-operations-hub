import { useCallback, useEffect, useRef, useState } from "react";
import { parseProductivityCsv, toProductivityCsvUrl } from "./productivity";
import { getRefreshSec, getSheetUrl } from "./store";
import type { Gaiola } from "./types";

interface State {
  rows: Gaiola[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Hook that loads the productivity sheet (2nd tab / gid=1) and refreshes
 * on the same interval as the main dashboard.
 */
export function useProductivityData() {
  const [state, setState] = useState<State>({
    rows: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const url = toProductivityCsvUrl(getSheetUrl());
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseProductivityCsv(text, new Date());
      setState({ rows, loading: false, error: null, lastUpdated: new Date() });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar produtividade",
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    void fetchData();
    const sec = getRefreshSec();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => void fetchData(), sec * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  return { ...state, refresh: fetchData };
}
