import { createContext, useContext, type ReactNode } from "react";
import { useDashboardData } from "@/lib/dashboard/useDashboardData";

type Ctx = ReturnType<typeof useDashboardData>;

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardData();
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): Ctx {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
