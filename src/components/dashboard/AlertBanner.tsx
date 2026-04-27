import { AlertOctagon, AlertTriangle, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "danger" | "warning" | "info" | "success";

const TONE = {
  danger: {
    border: "border-destructive/50",
    bg: "bg-destructive/10",
    text: "text-destructive",
    icon: AlertOctagon,
    glow: "animate-pulse-glow",
  },
  warning: {
    border: "border-warning/50",
    bg: "bg-warning/10",
    text: "text-warning",
    icon: AlertTriangle,
    glow: "",
  },
  info: {
    border: "border-accent-blue/50",
    bg: "bg-accent-blue/10",
    text: "text-accent-blue",
    icon: Info,
    glow: "",
  },
  success: {
    border: "border-success/50",
    bg: "bg-success/10",
    text: "text-success",
    icon: Sparkles,
    glow: "",
  },
} as const satisfies Record<Tone, { border: string; bg: string; text: string; icon: typeof Info; glow: string }>;

export interface AlertBannerProps {
  tone: Tone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function AlertBanner({ tone, title, description, action }: AlertBannerProps) {
  const cfg = TONE[tone];
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-3 overflow-hidden rounded-2xl border px-5 py-3 backdrop-blur",
        cfg.border,
        cfg.bg,
        cfg.glow,
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", cfg.text)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", cfg.text)}>{title}</p>
        {description && (
          <p className={cn("text-xs", cfg.text, "opacity-80")}>{description}</p>
        )}
      </div>
      {action && <div className="hidden md:block">{action}</div>}
    </motion.div>
  );
}
