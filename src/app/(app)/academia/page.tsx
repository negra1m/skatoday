import Link from "next/link";
import { ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import {
  getProfileLevel,
  hasProgram,
  listGymSessions,
  listWorkoutExercises,
  listWorkoutsForLevel,
} from "@/db/gym";
import { LEVELS, MAX_LEVEL, RPE_SCALE, levelInfo } from "@/lib/gym";
import { todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteGymSessionAction,
  levelDownAction,
  levelUpAction,
  seedProgramAction,
  startSessionAction,
} from "./actions";

export default async function AcademiaPage() {
  const s = (await getCurrentSession())!;
  const today = todayISO(s.user.timezone);

  if (!hasProgram(s.profile.id)) {
    return (
      <div className="space-y-4">
        <h1 className="text-hud text-2xl font-semibold">Academia</h1>
        <EmptyProgram />
      </div>
    );
  }

  const level = getProfileLevel(s.profile.id);
  const info = levelInfo(level);
  const blocks = listWorkoutsForLevel(s.profile.id, level);
  const counts = new Map(blocks.map((b) => [b.id, listWorkoutExercises(b.id).length]));
  const sessions = listGymSessions(s.profile.id);
  const todaySession = sessions.find((r) => r.session.date === today);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Academia</h1>

      {/* Nível atual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Nível {level} — {info.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{info.objetivo}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Faixa: {info.faixa}</span>
            <span>Frequência: {info.frequencia}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Semana: </span>
            {info.weekly}
          </p>
        </CardContent>
      </Card>

      {/* Treino de hoje */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Treino de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaySession ? (
            <>
              <p className="text-sm">
                {todaySession.workout?.name ?? "Treino livre"}
                <span className="text-muted-foreground"> · em andamento</span>
              </p>
              <Link href={`/academia/sessao/${todaySession.session.id}`} className="block">
                <Button className="w-full">Continuar treino</Button>
              </Link>
            </>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <form key={b.id} action={startSessionAction}>
                  <input type="hidden" name="workoutId" value={b.id} />
                  <SubmitButton
                    variant="outline"
                    className="flex w-full items-center justify-between"
                    pendingLabel="Abrindo..."
                  >
                    <span className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {b.block ? `${b.block} · ` : ""}
                      {b.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {counts.get(b.id) ?? 0} ex
                    </span>
                  </SubmitButton>
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critério de saída / subir de nível */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Subir de nível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Critério de saída do nível {level}
          </p>
          <ul className="space-y-1 text-sm">
            {info.exitCriteria.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-muted-foreground">▢</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Progressão é por critério, não por calendário. Só suba quando cumprir tudo com técnica
            estável e sem dor.
          </p>
          <div className="flex gap-2 pt-1">
            {level < MAX_LEVEL && (
              <form action={levelUpAction} className="flex-1">
                <SubmitButton className="w-full">
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Subir pro nível {level + 1}
                </SubmitButton>
              </form>
            )}
            {level > 0 && (
              <form action={levelDownAction}>
                <SubmitButton variant="ghost" size="sm">
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Descer
                </SubmitButton>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referência de esforço (RPE) */}
      <Card>
        <CardContent className="py-3">
          <details>
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              Escala de esforço (RPE)
            </summary>
            <div className="space-y-1 pt-3">
              {RPE_SCALE.map((r) => (
                <div key={r.rpe} className="flex items-baseline gap-2 text-xs">
                  <span className="w-5 font-medium tabular-nums">{r.rpe}</span>
                  <span className="flex-1">{r.label}</span>
                  <span className="text-muted-foreground">{r.reserva}</span>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>
          )}
          {sessions.map(({ session, workout }) => (
            <LogSwipeRow
              key={session.id}
              id={session.id}
              editHref={`/academia/sessao/${session.id}`}
              deleteAction={deleteGymSessionAction}
              confirmMessage="Deletar esse treino?"
            >
              <div className="border border-border bg-card px-3 py-2">
                <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                  {session.date}
                </div>
                <div className="text-sm">
                  {workout?.name ?? "Treino livre"}
                  {session.durationMinutes ? ` · ${session.durationMinutes}min` : ""}
                </div>
                {session.notes && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{session.notes}</div>
                )}
              </div>
            </LogSwipeRow>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Primeira visita: apresenta o programa de calistenia antes de gravar nada. */
function EmptyProgram() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Programa de calistenia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Progressão de peso corporal do sedentário ao nível Master. Você começa no Reinício e sobe
          por critério, não por calendário.
        </p>
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <div key={l.id} className="border border-border bg-card px-3 py-2">
              <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                Nível {l.id} · {l.faixa}
              </div>
              <div className="text-sm">{l.name}</div>
              <div className="text-xs text-muted-foreground">{l.objetivo}</div>
            </div>
          ))}
        </div>
        <form action={seedProgramAction}>
          <SubmitButton className="w-full" pendingLabel="Carregando...">
            Carregar programa de calistenia
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
