import Link from "next/link";
import { Dumbbell, Pencil, Plus } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { listGymSessions, listWorkoutExercises, listWorkouts } from "@/db/gym";
import { PRESET_PROGRAM, WEEKDAYS, weekdayFromISO } from "@/lib/gym";
import { todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createWorkoutAction,
  deleteGymSessionAction,
  seedProgramAction,
  startSessionAction,
} from "./actions";

export default async function AcademiaPage() {
  const s = (await getCurrentSession())!;
  const today = todayISO(s.user.timezone);
  const todayWeekday = weekdayFromISO(today);

  const workouts = listWorkouts(s.profile.id);
  const sessions = listGymSessions(s.profile.id);
  const todaySession = sessions.find((r) => r.session.date === today);

  const counts = new Map(workouts.map((w) => [w.id, listWorkoutExercises(w.id).length]));
  const suggested = workouts.find((w) => w.weekday === todayWeekday) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Academia</h1>

      {workouts.length === 0 ? (
        <EmptyProgram />
      ) : (
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
              <form action={startSessionAction} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="workoutId">Treino</Label>
                  <Select id="workoutId" name="workoutId" defaultValue={suggested?.id ?? ""}>
                    <option value="">Treino livre</option>
                    {workouts.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {w.weekday != null ? ` · ${WEEKDAYS[w.weekday]}` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
                {suggested && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sugerido pra hoje ({WEEKDAYS[todayWeekday]}): {suggested.name}
                  </p>
                )}
                <SubmitButton className="w-full" pendingLabel="Abrindo...">
                  Começar treino
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {workouts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meus treinos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workouts.map((w) => (
              <Link key={w.id} href={`/academia/treino/${w.id}`} className="block">
                <div className="flex items-center gap-3 border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/40">
                  <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm">{w.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {w.weekday != null ? `${WEEKDAYS[w.weekday]} · ` : ""}
                      {counts.get(w.id) ?? 0} exercícios
                    </div>
                  </div>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}

            <details className="pt-1">
              <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
                <Plus className="mr-1 inline h-3 w-3" />
                Novo treino
              </summary>
              <form action={createWorkoutAction} className="space-y-3 pt-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" placeholder="Ex: Upper C" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weekday">Dia fixo</Label>
                  <Select id="weekday" name="weekday" defaultValue="">
                    <option value="">Sem dia fixo</option>
                    {WEEKDAYS.map((label, i) => (
                      <option key={label} value={i}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <SubmitButton className="w-full">Criar treino</SubmitButton>
              </form>
            </details>
          </CardContent>
        </Card>
      )}

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

/** Primeira visita: mostra o que o programa base traz antes de gravar nada. */
function EmptyProgram() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Programa base</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nenhum treino ainda. Dá pra começar do programa base — depois é tudo editável.
        </p>
        <div className="space-y-2">
          {PRESET_PROGRAM.map((w) => (
            <div key={w.name} className="border border-border bg-card px-3 py-2">
              <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                {WEEKDAYS[w.weekday]}
              </div>
              <div className="text-sm">{w.name}</div>
              <div className="text-xs text-muted-foreground">
                {w.exercises.length} exercícios
              </div>
            </div>
          ))}
        </div>
        <form action={seedProgramAction}>
          <SubmitButton className="w-full" pendingLabel="Carregando...">
            Carregar programa base
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
