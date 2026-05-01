import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="scrollbar-thin min-w-0 flex-1 space-y-4 p-3 sm:p-4 md:space-y-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
