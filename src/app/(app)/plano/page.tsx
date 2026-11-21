import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Circle, Dot, Footprints, Ruler, Scale } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { latestBodyLog } from "@/db/queries";
import { getPerformancePhase } from "@/db/plan";
import {
  GOAL_NOTE,
  MAIN_GOAL_KG,
  MAX_PHASE,
  MILESTONES,
  PACE_NOTE,
  PERFORMANCE_PHASES,
  REF_2021_KG,
  START_WEIGHT_KG,
  WAIST_HEALTHY_CM,
  WAIST_START_CM,
  milestoneReached,
  planStatus,
  waistStatus,
} from "@/lib/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { advancePhaseAction, regressPhaseAction } from "./actions";

export default async function PlanoPage() {
  const s = (await getCurrentSession())!;
  const body = latestBodyLog(s.profile.id);
  const current = body?.weightKg ?? null;
  const st = planStatus(current);
  const waist = waistStatus(body?.waistCm ?? null);
  const phase = getPerformancePhase(s.profile.id);

  return (
    <div className="space-y-4">
      <Link href="/eu" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Eu
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Plano</h1>

      {/* Peso */}
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
            <p className="text-xs text-muted-foreground">Registre seu peso no Corpo pra ligar o acompanhamento.</p>
          )}
        </CardContent>
      </Card>

      {/* Metas de peso */}
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
                className={"flex items-center gap-3 rounded-md px-2 py-2 " + (isNext ? "bg-muted/50" : "")}
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
                <span className="flex-1 text-xs text-muted-foreground">{m.label}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.window}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-[10px] text-muted-foreground">{GOAL_NOTE}</p>
          <p className="text-[10px] text-muted-foreground">
            {PACE_NOTE} Referência 2021: {REF_2021_KG}kg.
          </p>
        </CardContent>
      </Card>

      {/* Cintura */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="h-4 w-4 text-primary" />
            Cintura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {waist.current != null ? "Medida atual" : "Sem medida ainda"}
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {waist.current != null ? `${waist.current}cm` : "—"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all"
              style={{ width: `${waist.pctToHealthy}%`, background: "var(--neon-gradient)" }}
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{WAIST_START_CM}cm</span>
            <span>meta &lt;{WAIST_HEALTHY_CM}cm</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {waist.current == null
              ? "Meça no umbigo, 1x por semana no mesmo ponto. Registre no Corpo."
              : waist.nextTargetCm != null
                ? `Faltam ${(waist.current - waist.nextTargetCm).toFixed(0)}cm pra ${waist.nextTargetCm}cm.`
                : "Abaixo da referência de saúde (cintura/altura < 0,5)."}
          </p>
        </CardContent>
      </Card>

      {/* Fases de performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Footprints className="h-4 w-4 text-primary" />
            Fase {phase} de 3
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PERFORMANCE_PHASES.map((p) => {
            const isCurrent = p.n === phase;
            const past = p.n < phase;
            return (
              <div
                key={p.n}
                className={"rounded-md border px-3 py-2 " + (isCurrent ? "border-primary bg-muted/40" : "border-border")}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Fase {p.n}</span>
                  <span className="text-sm font-medium">{p.titulo}</span>
                  {past && <Check className="ml-auto h-4 w-4 text-primary" />}
                  {isCurrent && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-primary">atual</span>
                  )}
                </div>
                {isCurrent && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {p.linhas.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <div className="flex gap-2">
            {phase < MAX_PHASE && (
              <form action={advancePhaseAction} className="flex-1">
                <SubmitButton className="w-full" pendingLabel="...">
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Avançar pra Fase {phase + 1}
                </SubmitButton>
              </form>
            )}
            {phase > 1 && (
              <form action={regressPhaseAction}>
                <SubmitButton variant="ghost" size="sm" pendingLabel="...">
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Voltar
                </SubmitButton>
              </form>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Link href="/corpo" className="flex-1">
              <Button variant="outline" className="w-full">
                Corpo (peso, cintura, fotos)
              </Button>
            </Link>
            {phase >= 2 && (
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
