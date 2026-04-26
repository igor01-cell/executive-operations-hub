import { useMemo, useState } from "react";
import type { Gaiola } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface Filters {
  search: string;
  buffer: string;
  categoria: string;
  perfil: string;
  turno: string;
  rua: string;
  risk: string; // "all" | "lost" | "atrisk" | "ok"
}

export const initialFilters: Filters = {
  search: "",
  buffer: "all",
  categoria: "all",
  perfil: "all",
  turno: "all",
  rua: "all",
  risk: "all",
};

export function applyFilters(rows: Gaiola[], f: Filters): Gaiola[] {
  return rows.filter((r) => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (
        !r.codigo.toLowerCase().includes(q) &&
        !r.rua.toLowerCase().includes(q)
      )
        return false;
    }
    if (f.buffer !== "all" && r.buffer !== f.buffer) return false;
    if (f.categoria !== "all" && r.categoria !== f.categoria) return false;
    if (f.perfil !== "all" && r.perfil !== f.perfil) return false;
    if (f.turno !== "all" && r.turno !== f.turno) return false;
    if (f.rua !== "all" && r.rua.toLowerCase() !== f.rua.toLowerCase()) return false;
    if (f.risk === "lost" && !r.isLost) return false;
    if (f.risk === "atrisk" && (r.isLost || !r.isAtRisk)) return false;
    if (f.risk === "ok" && r.isAtRisk) return false;
    return true;
  });
}

interface Props {
  rows: Gaiola[];
  value: Filters;
  onChange: (f: Filters) => void;
  hideBuffer?: boolean;
}

export function FiltersBar({ rows, value, onChange, hideBuffer }: Props) {
  const [open, setOpen] = useState(false);

  const opts = useMemo(() => {
    const uniq = (arr: string[]) =>
      Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      categoria: uniq(rows.map((r) => r.categoria)),
      perfil: uniq(rows.map((r) => r.perfil)),
      turno: uniq(rows.map((r) => r.turno)),
      rua: uniq(rows.map((r) => r.rua)),
    };
  }, [rows]);

  const setField = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...value, [k]: v });

  const activeCount = Object.entries(value).filter(
    ([k, v]) => k !== "search" && v !== "all" && v !== "",
  ).length;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            value={value.search}
            onChange={(e) => setField("search", e.target.value)}
            placeholder="Buscar código ou rua..."
            className="bg-background/40 border-border/60 pl-3"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="border-border/60 bg-background/40"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...initialFilters, search: value.search })}
          >
            <X className="h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {!hideBuffer && (
            <SelectField
              label="Buffer"
              value={value.buffer}
              onChange={(v) => setField("buffer", v)}
              options={["RTS", "EHA", "SALVADOS"]}
            />
          )}
          <SelectField
            label="Categoria"
            value={value.categoria}
            onChange={(v) => setField("categoria", v)}
            options={opts.categoria}
          />
          <SelectField
            label="Perfil"
            value={value.perfil}
            onChange={(v) => setField("perfil", v)}
            options={opts.perfil}
          />
          <SelectField
            label="Turno"
            value={value.turno}
            onChange={(v) => setField("turno", v)}
            options={opts.turno}
          />
          <SelectField
            label="Rua"
            value={value.rua}
            onChange={(v) => setField("rua", v)}
            options={opts.rua}
          />
          <SelectField
            label="Status risco"
            value={value.risk}
            onChange={(v) => setField("risk", v)}
            options={[
              { v: "lost", l: "LOST (>14d)" },
              { v: "atrisk", l: "Em risco (>10d)" },
              { v: "ok", l: "Saudável" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { v: string; l: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background/40 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass-elevated border-border/60">
          <SelectItem value="all">Todos</SelectItem>
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.v;
            const l = typeof o === "string" ? o : o.l;
            return (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </label>
  );
}
