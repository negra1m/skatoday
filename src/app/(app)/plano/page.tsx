import Link from "next/link";
import { Check, Circle, Dot, Footprints, PersonStanding, Scale } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { latestBodyLog } from "@/db/queries";
import {
  MAIN_GOAL_KG,
  MILESTONES,
  PACE_NOTE,
  PHASE_GUIDE,
  START_WEIGHT_KG,
  milestoneReached,
  planStatus,
} from "@/lib/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PlanoPage() {
  const s = (await getCurrentSession())!;
  const body = latestBodyLog(s.profile.id);
  const current = body?.weightKg ?? null;
  const st = planStatus(current);
  const guide = PHASE_GUIDE[st.phase];

  return (
    <div className="space-y-4">
      <Link href="/eu" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Eu
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Plano</h1>

      {/* Peso atual + progresso */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              Peso atual
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {current != null ? `${current}kg` : "—"}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all"
              style={{ width: `${st.pctToMainGoal}%`, background: "var(--neon-gradient)" }}
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{START_WEIGHT_KG}kg</span>
            <span>-{st.lostKg}kg · {st.pctToMainGoal}%</span>
            <span>{MAIN_GOAL_KG}kg</span>
          </div>

          {current == null && (
            <p className="text-xs text-muted-foreground">
              Registre seu peso no Corpo pra ligar o acompanhamento.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Escada de metas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Metas de peso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {MILESTONES.map((m) => {
            const reached = milestoneReached(m, current);
            const isNext = st.nextMilestone?.kg === m.kg;
            return (
              <div
                key={m.kg}
                className={
                  "flex items-center gap-3 rounded-md px-2 py-2 " + (isNext ? "bg-muted/50" : "")
                }
              >
                <span className="shrink-0">
                  {reached ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : isNext ? (
                    <Dot className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">{m.kg}kg</span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {m.label}
                  {m.optional ? " · opcional" : ""}
                </span>
                {isNext && (
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-primary">
                    próxima
                  </span>
                )}
              </div>
            );
          })}
          <p className="pt-1 text-[10px] text-muted-foreground">{PACE_NOTE}</p>
        </CardContent>
      </Card>

      {/* Fase de atividade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {st.phase === "corrida" ? (
              <Footprints className="h-4 w-4 text-primary" />
            ) : (
              <PersonStanding className="h-4 w-4 text-primary" />
            )}
            {guide.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!st.runUnlocked && st.toNextKg != null && (
            <p className="text-xs text-muted-foreground">
              Faltam <span className="text-foreground tabular-nums">{st.toNextKg}kg</span> pra retomar a
              corrida.
            </p>
          )}
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {guide.linhas.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>

          <div className="flex gap-2 pt-1">
            <Link href="/corpo" className="flex-1">
              <Button variant="outline" className="w-full">
                Registrar peso
              </Button>
            </Link>
            {st.runUnlocked && (
              <Link href="/corrida" className="flex-1">
                <Button variant="outline" className="w-full">
                  Registrar corrida
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
