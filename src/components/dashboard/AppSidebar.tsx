import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Boxes, ChevronLeft, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    to: "/" as const,
    label: "Operação",
    sub: "EHA & RTS",
    icon: Activity,
    accent: "from-destructive/40 to-destructive/0",
  },
  {
    to: "/salvados" as const,
    label: "Salvados",
    sub: "Buffer reverso",
    icon: Boxes,
    accent: "from-warning/40 to-warning/0",
  },
  {
    to: "/mapa" as const,
    label: "Mapa Visual",
    sub: "Buffer 10×7",
    icon: LayoutGrid,
    accent: "from-info/40 to-info/0",
  },
];

const STORAGE_KEY = "spx.sidebar.collapsed";

export function AppSidebar() {
  const { location } = useRouterState();
  const path = location.pathname;

  // Initial state: collapsed by default on small screens, persisted in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
    return window.innerWidth < 1280;
  });

  // Persist user preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed]);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "glass-elevated sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Brand + toggle */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border/40 px-4 py-5",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
          <span className="text-[11px] font-black tracking-tighter text-primary-foreground">
            SPX
          </span>
        </div>
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "opacity-100",
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            SPX
          </p>
          <p className="truncate text-sm font-bold leading-tight">RTS Control</p>
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Recolher menu"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/30 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Floating expand button when collapsed */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expandir menu"
          className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/40 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ITEMS.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? `${item.label} · ${item.sub}` : undefined}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all",
                collapsed && "justify-center px-2",
                active
                  ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                  : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
              )}
            >
              {active && (
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-60",
                    item.accent,
                  )}
                />
              )}
              <span
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-primary/50 bg-primary/20 text-primary-foreground shadow-glow"
                    : "border-border/40 bg-background/30",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "relative flex min-w-0 flex-col overflow-hidden transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "opacity-100",
                )}
              >
                <span className="truncate font-semibold">{item.label}</span>
                <span className="truncate text-[10px] uppercase tracking-wider opacity-70">
                  {item.sub}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-border/40 p-4 text-[10px] uppercase tracking-wider text-muted-foreground transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100",
        )}
      >
        {!collapsed && (
          <>
            <p>SoC Betim · MG</p>
            <p className="mt-0.5 text-[9px] opacity-70">v1.0 · Executive BI</p>
          </>
        )}
      </div>
    </aside>
  );
}
