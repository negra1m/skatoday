"use client";

import * as React from "react";
import { Minus, Plus, Droplet } from "lucide-react";
import { useRouter } from "next/navigation";
import { addGlassAction, removeGlassAction } from "@/app/(app)/agua/actions";
import { play } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function WaterControls({
  goalMl,
  glassSizeMl,
  initialDrunkMl,
  initialGlasses,
}: {
  goalMl: number;
  glassSizeMl: number;
  initialDrunkMl: number;
  initialGlasses: number;
}) {
  const router = useRouter();
  const [drunkMl, setDrunkMl] = React.useState(initialDrunkMl);
  const [glasses, setGlasses] = React.useState(initialGlasses);
  const [pending, setPending] = React.useState(false);

  const pct = Math.min(100, Math.round((drunkMl / goalMl) * 100));
  const isGoalComplete = drunkMl >= goalMl;

  async function inc() {
    if (pending) return;
    setPending(true);
    const newMl = drunkMl + glassSizeMl;
    setDrunkMl(newMl);
    setGlasses(glasses + 1);
    const justCompleted = !isGoalComplete && newMl >= goalMl;
    play(justCompleted ? "goalComplete" : "drink");
    try {
      await addGlassAction();
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  async function dec() {
    if (pending || glasses === 0) return;
    setPending(true);
    setDrunkMl(Math.max(0, drunkMl - glassSizeMl));
    setGlasses(Math.max(0, glasses - 1));
    play("tick");
    try {
      await removeGlassAction();
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Hoje</span>
        <span className={cn("text-hud text-3xl font-semibold tabular-nums", isGoalComplete && "neon-glow")}>
          {(drunkMl / 1000).toFixed(2)}<span className="text-sm text-muted-foreground">L</span>
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 60 ? "var(--neon-gradient)" : "hsl(var(--foreground))",
            boxShadow: isGoalComplete ? "0 0 12px hsl(var(--neon-purple) / 0.6)" : undefined,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{glasses} {glasses === 1 ? "copo" : "copos"} · {glassSizeMl}ml cada</span>
        <span>{pct}% · meta {(goalMl / 1000).toFixed(1)}L</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={pending || glasses === 0}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-input bg-secondary text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
          aria-label="Remover copo"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={inc}
          disabled={pending}
          className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          <Droplet className="h-4 w-4" />
          + {glassSizeMl}ml
        </button>
        <button
          type="button"
          onClick={inc}
          disabled={pending}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-input bg-secondary text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
          aria-label="Adicionar copo"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
