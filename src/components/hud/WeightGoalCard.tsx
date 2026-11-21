import Link from "next/link";
import { Footprints, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MAIN_GOAL_KG, START_WEIGHT_KG, phaseShortLabel, planStatus } from "@/lib/plan";

export function WeightGoalCard({ current, phase }: { current: number | null; phase: number }) {
  const st = planStatus(current);

  return (
    <Link href="/plano" className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Meta de peso
            </span>
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Footprints className="h-3.5 w-3.5" /> {phaseShortLabel(phase)}
            </span>
          </div>

          {st.current == null ? (
            <p className="text-xs text-muted-foreground">
              Registre seu peso no Corpo pra começar a acompanhar a meta.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tabular-nums">{st.current}kg</span>
                {st.nextMilestone ? (
                  <span className="text-xs text-muted-foreground">
                    faltam <span className="text-foreground tabular-nums">{st.toNextKg}kg</span> pra{" "}
                    {st.nextMilestone.kg}kg
                  </span>
                ) : (
                  <span className="text-xs text-primary">objetivo batido</span>
                )}
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full transition-all"
                  style={{ width: `${st.pctToMainGoal}%`, background: "var(--neon-gradient)" }}
                />
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{START_WEIGHT_KG}kg</span>
                <span>-{st.lostKg}kg</span>
                <span>{MAIN_GOAL_KG}kg</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
