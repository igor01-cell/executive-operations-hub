import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  LayoutGrid,
  Loader2,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useDashboard } from "@/lib/dashboard/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setRefreshSec, setSheetUrl } from "@/lib/dashboard/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TITLES: Record<string, { title: string; sub: string; icon: typeof Activity }> = {
  "/": {
    title: "Operação · EHA & RTS",
    sub: "Monitoramento operacional e risco em tempo real",
    icon: Activity,
  },
  "/salvados": {
    title: "Buffer de Salvados",
    sub: "Logística reversa e leilão",
    icon: Boxes,
  },
  "/mapa": {
    title: "Mapa Visual do Buffer",
    sub: "Layout físico 10 ruas × 7 posições",
    icon: LayoutGrid,
  },
};

export function AppHeader() {
  const { location } = useRouterState();
  const meta = TITLES[location.pathname] ?? TITLES["/"];
  const Icon = meta.icon;
  const ctx = useDashboard();
  const [open, setOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(ctx.sheetUrl);

  return (
    <header className="glass sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4">
      {ctx.loading && ctx.rows.length > 0 && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-[shimmer_1.2s_linear_infinite] bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/40 sm:h-11 sm:w-11">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight sm:text-lg md:text-xl">
            {meta.title}
          </h1>
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{meta.sub}</p>
        </div>
      </div>

      {/* mobile nav */}
      <div className="order-3 flex w-full items-center gap-2 lg:order-none lg:hidden lg:w-auto">
        <MobileNav />
        <StatusPill ctx={ctx} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden lg:block">
          <StatusPill ctx={ctx} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => ctx.refresh()}
          disabled={ctx.loading}
          aria-label="Atualizar"
          className="border-border/60 bg-background/40"
        >
          {ctx.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Atualizar</span>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-border/60 bg-background/40"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="glass-elevated border-l-border/60">
            <SheetHeader>
              <SheetTitle>Configurações da fonte</SheetTitle>
              <SheetDescription>
                Cole a URL da planilha publicada do Google Sheets
                (Arquivo → Compartilhar → Publicar na web).
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  URL da planilha
                </span>
                <Input
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pubhtml"
                  className="bg-background/40"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Auto-refresh
                </span>
                <Select
                  value={String(ctx.refreshSec)}
                  onValueChange={(v) => {
                    const n = Number(v);
                    setRefreshSec(n);
                    ctx.setRefreshInterval(n);
                  }}
                >
                  <SelectTrigger className="bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-elevated">
                    <SelectItem value="15">A cada 15 segundos</SelectItem>
                    <SelectItem value="30">A cada 30 segundos</SelectItem>
                    <SelectItem value="60">A cada 1 minuto</SelectItem>
                    <SelectItem value="300">A cada 5 minutos</SelectItem>
                    <SelectItem value="600">A cada 10 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow"
                onClick={() => {
                  setSheetUrl(tempUrl);
                  ctx.setUrlAndRefresh(tempUrl);
                  setOpen(false);
                }}
              >
                Salvar e recarregar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function StatusPill({ ctx }: { ctx: ReturnType<typeof useDashboard> }) {
  const error = ctx.error;
  return (
    <div
      className={cn(
        "ml-auto flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]",
        error
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-success/40 bg-success/10 text-success",
      )}
    >
      {error ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
      {error
        ? "Sem conexão"
        : ctx.lastUpdated
          ? `Atualizado ${formatDistanceToNow(ctx.lastUpdated, { addSuffix: true, locale: ptBR })}`
          : "Carregando..."}
    </div>
  );
}

function MobileNav() {
  const { location } = useRouterState();
  const items = [
    { to: "/" as const, label: "Operação", icon: Activity },
    { to: "/salvados" as const, label: "Salvados", icon: Boxes },
    { to: "/mapa" as const, label: "Mapa", icon: LayoutGrid },
  ];
  return (
    <div className="flex gap-1 rounded-xl border border-border/40 bg-background/30 p-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = location.pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs",
              active
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </div>
  );
}
