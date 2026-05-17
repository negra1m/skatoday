import { cn } from "@/lib/utils";

type Cell = {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
};

// Tons de roxo neon Few (escala estilo GitHub contributions, mas em roxo)
const INTENSITY_STYLE: Record<Cell["intensity"], string> = {
  0: "bg-[hsl(268_25%_12%/_0.6)]",
  1: "bg-[hsl(268_50%_28%)]",
  2: "bg-[hsl(268_70%_45%)]",
  3: "bg-[hsl(268_85%_60%)]",
  4: "bg-[hsl(268_92%_72%)] shadow-[0_0_8px_hsl(268_92%_72%/_0.6)]",
};

export function StreakMap({ cells, year, month }: { cells: Cell[]; year: number; month: number }) {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startCol = first.getDay();
  const map = new Map(cells.map((c) => [c.date, c.intensity] as const));

  const grid: (Cell | null)[] = [];
  for (let i = 0; i < startCol; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    grid.push({ date: iso, intensity: (map.get(iso) ?? 0) as Cell["intensity"] });
  }

  return (
    <div className="grid grid-cols-7 gap-1.5 text-hud">
      {grid.map((c, i) =>
        c ? (
          <div
            key={i}
            title={c.date}
            className={cn(
              "aspect-square rounded-sm border border-border/50",
              INTENSITY_STYLE[c.intensity],
            )}
          />
        ) : (
          <div key={i} className="aspect-square" />
        ),
      )}
    </div>
  );
}
