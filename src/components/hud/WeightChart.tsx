// Gráfico SVG inline — sem dependência externa.
// Mostra a linha do peso + delta total, mínimo, máximo, atual.

type Point = { date: string; weight: number };

export function WeightChart({ points }: { points: Point[] }) {
  if (points.length < 2) return null;

  const W = 320;
  const H = 120;
  const padX = 8;
  const padY = 16;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const cur = weights[weights.length - 1];
  const first = weights[0];
  const delta = cur - first;

  const stepX = (W - padX * 2) / (points.length - 1);
  const yFor = (w: number) => padY + (H - padY * 2) * (1 - (w - min) / range);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${padX + i * stepX} ${yFor(p.weight)}`)
    .join(" ");

  const areaD =
    pathD + ` L ${padX + (points.length - 1) * stepX} ${H - padY} L ${padX} ${H - padY} Z`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-hud">
        <Stat label="Atual" value={`${cur.toFixed(1)}kg`} />
        <Stat label="Δ total" value={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}kg`} tone={delta < 0 ? "good" : delta > 0 ? "bad" : "neutral"} />
        <Stat label="Mín" value={`${min.toFixed(1)}kg`} />
        <Stat label="Máx" value={`${max.toFixed(1)}kg`} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#weight-fill)" />
        <path d={pathD} fill="none" stroke="white" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={padX + i * stepX}
            cy={yFor(p.weight)}
            r={i === points.length - 1 ? 3 : 1.5}
            fill={i === points.length - 1 ? "white" : "rgba(255,255,255,0.6)"}
          >
            <title>{`${p.date}: ${p.weight}kg`}</title>
          </circle>
        ))}
      </svg>

      <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-2 py-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span
        className={
          tone === "good"
            ? "text-sm font-semibold tabular-nums text-emerald-400"
            : tone === "bad"
              ? "text-sm font-semibold tabular-nums text-red-400"
              : "text-sm font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
