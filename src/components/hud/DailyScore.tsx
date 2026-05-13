import { cn } from "@/lib/utils";

export function DailyScore({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Score do dia</span>
        <span className={cn("text-hud text-3xl font-semibold tabular-nums", pct >= 60 && "neon-glow")}>{pct}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            pct < 30 && "bg-zinc-500",
            pct >= 30 && pct < 60 && "bg-zinc-300",
            pct >= 60 && "bg-[image:var(--neon-gradient)] shadow-[0_0_8px_rgba(139,92,246,0.5)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
