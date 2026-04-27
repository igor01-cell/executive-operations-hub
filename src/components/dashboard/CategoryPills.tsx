import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  label: string;
  count?: number;
  /** Match function: receives a row's `categoria` (already normalized). */
  match: (categoria: string, buffer: string) => boolean;
}

interface Props {
  options: CategoryOption[];
  value: string; // "all" or option.id
  onChange: (id: string) => void;
}

/**
 * Mutually exclusive category pills (radio-like). Used on the Operation
 * screen to switch between EHA Online / Off com ID / Off sem ID etc.
 */
export function CategoryPills({ options, value, onChange }: Props) {
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
      <Pill active={value === "all"} onClick={() => onChange("all")} label="Todos" />
      {options.map((opt) => (
        <Pill
          key={opt.id}
          active={value === opt.id}
          onClick={() => onChange(opt.id)}
          label={opt.label}
          count={opt.count}
        />
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-glow"
          : "bg-background/30 text-muted-foreground hover:bg-background/50 hover:text-foreground",
      )}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
            active ? "bg-primary-foreground/20" : "bg-background/60",
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}
