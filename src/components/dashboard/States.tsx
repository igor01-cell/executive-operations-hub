import { AlertOctagon, Inbox, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Carregando...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function EmptyState({
  title = "Nenhum dado para exibir",
  description = "Ajuste os filtros ou aguarde a próxima atualização.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-40 flex-col items-center justify-center gap-2 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/40">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-40 flex-col items-center justify-center gap-2 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10">
        <AlertOctagon className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-destructive">Falha ao carregar dados</p>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-1 border-destructive/40">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full bg-background/40" />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <Skeleton className="h-3 w-24 bg-background/40" />
      <Skeleton className="mt-3 h-8 w-32 bg-background/40" />
      <Skeleton className="mt-2 h-3 w-20 bg-background/40" />
    </div>
  );
}
