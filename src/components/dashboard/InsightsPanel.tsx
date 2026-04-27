import {
  generateInsights,
  generateReverseInsights,
} from "@/lib/dashboard/insights";
import type { Gaiola } from "@/lib/dashboard/types";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON = {
  info: Info,
  warning: TrendingUp,
  danger: ShieldAlert,
  success: Sparkles,
} as const;

const STYLE = {
  info: "border-accent-blue/40 text-accent-blue",
  warning: "border-warning/40 text-warning",
  danger: "border-destructive/40 text-destructive",
  success: "border-success/40 text-success",
} as const;

/**
 * mode="operation"  → insights de monitoramento (risco/lost/atRisk).
 * mode="reverse"    → insights do buffer reverso (sem conceito de risco).
 */
export function InsightsPanel({
  rows,
  mode = "operation",
}: {
  rows: Gaiola[];
  mode?: "operation" | "reverse";
}) {
  const insights = useMemo(
    () =>
      mode === "reverse"
        ? generateReverseInsights(rows)
        : generateInsights(rows),
    [rows, mode],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Insights Automáticos
          </h3>
          <p className="text-xs text-muted-foreground">
            Tendências, gargalos e alertas inteligentes detectados em tempo real
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((ins, i) => {
          const Icon = ICON[ins.level];
          return (
            <motion.div
              key={`${ins.title}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={cn(
                "flex gap-3 rounded-xl border bg-background/30 p-3 backdrop-blur transition-colors",
                STYLE[ins.level],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {ins.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {ins.description}
                </p>
              </div>
            </motion.div>
          );
        })}
        {insights.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-border/40 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Sem insights disponíveis no momento.
          </div>
        )}
      </div>
    </motion.div>
  );
}
