import { motion } from "framer-motion";

/**
 * Legenda padrão dos perfis de gaylord — usada em todas as telas para
 * manter a definição consistente em todo o site.
 *
 *   • P (Pequeno) → 150 ou mais produtos   (volume alto)
 *   • M (Médio)   → 31 a 149 produtos      (volume intermediário)
 *   • G (Grande)  → 1 a 30 produtos        (volume baixo)
 */
export function PerfilLegend({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground ${className}`}
      >
        <span className="font-semibold uppercase tracking-wider text-foreground/80">
          Perfis:
        </span>
        <PerfilChip letter="P" label="150+ pcs" />
        <PerfilChip letter="M" label="31–149 pcs" />
        <PerfilChip letter="G" label="1–30 pcs" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      <span className="font-semibold text-foreground">
        Classificação dos perfis por quantidade de produtos no gaylord
      </span>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        <PerfilChip letter="P" label="Pequeno · 150+ produtos (volume alto)" />
        <PerfilChip letter="M" label="Médio · 31 a 149 produtos (volume intermediário)" />
        <PerfilChip letter="G" label="Grande · 1 a 30 produtos (volume baixo)" />
      </div>
    </motion.div>
  );
}

function PerfilChip({ letter, label }: { letter: "P" | "M" | "G"; label: string }) {
  const tone =
    letter === "P"
      ? "border-accent-blue/40 text-accent-blue"
      : letter === "M"
        ? "border-warning/40 text-warning"
        : "border-success/40 text-success";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md border bg-background/30 px-1.5 text-[10px] font-bold ${tone}`}
      >
        {letter}
      </span>
      <span className="text-foreground/80">{label}</span>
    </span>
  );
}
