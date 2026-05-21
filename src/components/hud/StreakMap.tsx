"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Cell = {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  tricksCount: number;
};

const INTENSITY_STYLE: Record<Cell["intensity"], string> = {
  0: "bg-[hsl(268_25%_12%/_0.6)]",
  1: "bg-[hsl(268_50%_28%)]",
  2: "bg-[hsl(268_70%_45%)]",
  3: "bg-[hsl(268_85%_60%)]",
  4: "bg-[hsl(268_92%_72%)] shadow-[0_0_8px_hsl(268_92%_72%/_0.6)]",
};

function tooltipText(c: Cell): string {
  const [y, m, d] = c.date.split("-");
  const dm = `${d}/${m}`;
  if (c.tricksCount === 0) return `Sem tricks · ${dm}`;
  if (c.tricksCount === 1) return `1 trick em ${dm}`;
  return `${c.tricksCount} tricks em ${dm}`;
}

export function StreakMap({ cells, year, month }: { cells: Cell[]; year: number; month: number }) {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startCol = first.getDay();
  const map = new Map(cells.map((c) => [c.date, c] as const));

  const grid: (Cell | null)[] = [];
  for (let i = 0; i < startCol; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const existing = map.get(iso);
    grid.push(existing ?? { date: iso, intensity: 0, tricksCount: 0 });
  }

  const [selected, setSelected] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!selected) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setSelected(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [selected]);

  const selectedCell = selected ? grid.find((c) => c?.date === selected) ?? null : null;
  // Calcula posição do tooltip baseado no índice da célula no grid
  const selectedIdx = selectedCell ? grid.indexOf(selectedCell) : -1;
  const tooltipRow = selectedIdx >= 0 ? Math.floor(selectedIdx / 7) : -1;
  const tooltipCol = selectedIdx >= 0 ? selectedIdx % 7 : -1;

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-7 gap-1.5 text-hud">
        {grid.map((c, i) =>
          c ? (
            <button
              key={i}
              type="button"
              title={tooltipText(c)}
              aria-label={tooltipText(c)}
              onClick={() => setSelected((s) => (s === c.date ? null : c.date))}
              className={cn(
                "aspect-square rounded-sm border border-border/50 transition-all hover:ring-2 hover:ring-white/30",
                INTENSITY_STYLE[c.intensity],
                selected === c.date && "ring-2 ring-white/80",
              )}
            />
          ) : (
            <div key={i} className="aspect-square" />
          ),
        )}
      </div>

      {selectedCell && tooltipRow >= 0 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground shadow-lg whitespace-nowrap"
          style={{
            // posiciona logo abaixo da célula selecionada
            left: `calc(${(tooltipCol + 0.5) * (100 / 7)}% )`,
            top: `calc(${(tooltipRow + 1) * (100 / 7)}% + 8px)`,
          }}
        >
          {tooltipText(selectedCell)}
        </div>
      )}
    </div>
  );
}
