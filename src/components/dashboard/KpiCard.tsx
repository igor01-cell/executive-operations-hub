import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  default: "from-primary/30 to-primary/0 text-primary",
  danger: "from-destructive/40 to-destructive/0 text-destructive",
  warning: "from-warning/40 to-warning/0 text-warning",
  success: "from-success/40 to-success/0 text-success",
};

export function KpiCard({ label, value, hint, icon, tone = "default" }: Props) {
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:border-primary/30">
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-radial blur-2xl opacity-60 transition-opacity group-hover:opacity-100 bg-gradient-to-br",
          toneClasses[tone],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/30 backdrop-blur",
              tone === "danger" && "text-destructive border-destructive/30",
              tone === "warning" && "text-warning border-warning/30",
              tone === "success" && "text-success border-success/30",
              tone === "default" && "text-primary border-primary/30",
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
