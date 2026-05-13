import { cn } from "@/lib/utils";

type Cell = {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
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
              "aspect-square rounded-sm border border-border",
              c.intensity === 0 && "bg-muted/30",
              c.intensity === 1 && "bg-muted",
              c.intensity === 2 && "bg-zinc-500",
              c.intensity === 3 && "bg-zinc-300",
              c.intensity === 4 && "bg-white",
            )}
          />
        ) : (
          <div key={i} className="aspect-square" />
        ),
      )}
    </div>
  );
}
