import { type ReactNode, memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "danger" | "warning" | "success" | "info";
  index?: number;
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  default: "from-primary/30 to-primary/0 text-primary",
  danger: "from-destructive/40 to-destructive/0 text-destructive",
  warning: "from-warning/40 to-warning/0 text-warning",
  success: "from-success/40 to-success/0 text-success",
  info: "from-accent-blue/40 to-accent-blue/0 text-accent-blue",
};

const iconBorder: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-primary border-primary/30",
  danger: "text-destructive border-destructive/30",
  warning: "text-warning border-warning/30",
  success: "text-success border-success/30",
  info: "text-accent-blue border-accent-blue/30",
};

function KpiCardImpl({ label, value, hint, icon, tone = "default", index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="glass group relative overflow-hidden rounded-2xl p-5 transition-colors hover:border-primary/30"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl opacity-60 transition-opacity group-hover:opacity-100 bg-gradient-to-br",
          toneClasses[tone],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border bg-background/30 backdrop-blur",
              iconBorder[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const KpiCard = memo(KpiCardImpl);
