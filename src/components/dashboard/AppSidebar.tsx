import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Boxes, LayoutGrid, Package } from "lucide-react";
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

export function AppSidebar() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <aside className="glass-elevated sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 lg:flex">
      <div className="flex items-center gap-3 border-b border-border/40 px-5 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            SPX
          </p>
          <p className="text-sm font-bold leading-tight">RTS Control</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ITEMS.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all",
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
                  "relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-primary/50 bg-primary/20 text-primary-foreground shadow-glow"
                    : "border-border/40 bg-background/30",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="relative flex flex-col">
                <span className="font-semibold">{item.label}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {item.sub}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4 text-[10px] uppercase tracking-wider text-muted-foreground">
        <p>SoC Betim · MG</p>
        <p className="mt-0.5 text-[9px] opacity-70">v1.0 · Executive BI</p>
      </div>
    </aside>
  );
}
