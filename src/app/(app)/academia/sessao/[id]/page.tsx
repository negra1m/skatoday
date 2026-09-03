import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import {
  exerciseHistory,
  getGymSession,
  getWorkout,
  listExercises,
  listSessionSets,
  listWorkoutExercises,
} from "@/db/gym";
import {
  formatSetLine,
  maxWeight,
  progressionStatus,
  suggestedNextWeight,
  type LoggedSet,
  type MuscleGroup,
  type ProgressionStatus,
} from "@/lib/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { bumpTargetWeightAction, finishSessionAction, logExerciseSetsAction } from "../../actions";

export default async function SessaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;

  const session = getGymSession(s.profile.id, id);
  if (!session) notFound();

  const workout = session.workoutId ? getWorkout(s.profile.id, session.workoutId) : null;
  const planned = workout ? listWorkoutExercises(workout.id) : [];
  const loggedSets = listSessionSets(session.id);

  // Treino livre: sem template, oferece o catálogo inteiro pra registrar.
  const freeExercises = workout ? [] : listExercises(s.profile.id);

  return (
    <div className="space-y-4">
      <Link href="/academia" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Academia
      </Link>

      <div>
        <h1 className="text-hud text-2xl font-semibold">{workout?.name ?? "Treino livre"}</h1>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{session.date}</p>
      </div>

      {planned.map(({ we, exercise }) => (
        <ExerciseBlock
          key={we.id}
          profileId={s.profile.id}
          sessionId={session.id}
          workoutExerciseId={we.id}
          exerciseId={exercise.id}
          name={exercise.name}
          group={exercise.muscleGroup}
          sets={we.sets}
          repMin={we.repMin}
          repMax={we.repMax}
          targetWeightKg={we.targetWeightKg}
          notes={we.notes}
          loggedSets={loggedSets.filter((x) => x.exerciseId === exercise.id)}
        />
      ))}

      {!workout && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exercícios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {freeExercises.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum exercício no catálogo ainda. Crie um treino pra montar a lista.
              </p>
            )}
            {freeExercises.map((ex) => (
              <details key={ex.id} className="border border-border bg-card px-3 py-2">
                <summary className="cursor-pointer text-sm">{ex.name}</summary>
                <div className="pt-3">
                  <SetForm
                    sessionId={session.id}
                    exerciseId={ex.id}
                    setCount={3}
                    loggedSets={loggedSets.filter((x) => x.exerciseId === ex.id)}
                    fallbackWeight={null}
                  />
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fechar treino</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={finishSessionAction} className="space-y-3">
            <input type="hidden" name="sessionId" value={session.id} />
            <div className="space-y-1">
              <Label htmlFor="durationMinutes">Duração (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                defaultValue={session.durationMinutes ?? ""}
                placeholder="50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={session.notes ?? ""} />
            </div>
            <SubmitButton className="w-full" pendingLabel="Salvando...">
              Finalizar treino
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type BlockProps = {
  profileId: string;
  sessionId: string;
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  group: MuscleGroup;
  sets: number;
  repMin: number;
  repMax: number;
  targetWeightKg: number | null;
  notes: string | null;
  loggedSets: LoggedSet[];
};

function ExerciseBlock(props: BlockProps) {
  // Histórico exclui a sessão atual: a progressão compara com o que já
  // estava fechado antes de hoje.
  const history = exerciseHistory({
    profileId: props.profileId,
    exerciseId: props.exerciseId,
    excludeSessionId: props.sessionId,
    limit: 2,
  });
  const last = history[0];
  const previous = history[1];

  const status = progressionStatus({
    sets: props.sets,
    repMax: props.repMax,
    lastSession: last?.sets ?? [],
    previousSession: previous?.sets,
  });
  const nextWeight = suggestedNextWeight({
    status,
    group: props.group,
    lastSession: last?.sets ?? [],
  });

  const fallbackWeight = props.targetWeightKg ?? (last ? maxWeight(last.sets) || null : null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{props.name}</CardTitle>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {props.sets} × {props.repMin}–{props.repMax} · {props.group}
            </p>
          </div>
          <ProgressBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {last && (
          <p className="text-xs text-muted-foreground">
            Última ({last.date}): {maxWeight(last.sets) > 0 ? `${maxWeight(last.sets)}kg · ` : ""}
            {formatSetLine(last.sets)}
          </p>
        )}
        {props.notes && <p className="text-xs text-muted-foreground">{props.notes}</p>}

        {nextWeight != null && (
          <form
            action={bumpTargetWeightAction}
            className="flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-2"
          >
            <input type="hidden" name="workoutExerciseId" value={props.workoutExerciseId} />
            <input type="hidden" name="sessionId" value={props.sessionId} />
            <input type="hidden" name="weight" value={nextWeight} />
            <p className="flex-1 text-xs">
              Fechou a faixa. Subir pra <strong>{nextWeight}kg</strong>?
            </p>
            <SubmitButton size="sm" variant="secondary">
              Aplicar
            </SubmitButton>
          </form>
        )}

        <SetForm
          sessionId={props.sessionId}
          exerciseId={props.exerciseId}
          setCount={props.sets}
          loggedSets={props.loggedSets}
          fallbackWeight={fallbackWeight}
        />
      </CardContent>
    </Card>
  );
}

function SetForm({
  sessionId,
  exerciseId,
  setCount,
  loggedSets,
  fallbackWeight,
}: {
  sessionId: string;
  exerciseId: string;
  setCount: number;
  loggedSets: LoggedSet[];
  fallbackWeight: number | null;
}) {
  const rows = Array.from({ length: setCount }, (_, i) => i + 1);
  const byNumber = new Map(loggedSets.map((x) => [x.setNumber, x]));

  return (
    <form action={logExerciseSetsAction} className="space-y-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="setCount" value={setCount} />

      <div className="flex gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="w-5" />
        <span className="flex-1">Carga (kg)</span>
        <span className="flex-1">Reps</span>
      </div>

      {rows.map((i) => {
        const logged = byNumber.get(i);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-xs text-muted-foreground">{i}</span>
            <Input
              name={`weight-${i}`}
              type="number"
              step="0.5"
              inputMode="decimal"
              className="flex-1"
              defaultValue={logged?.weightKg ?? fallbackWeight ?? ""}
            />
            <Input
              name={`reps-${i}`}
              type="number"
              inputMode="numeric"
              className="flex-1"
              defaultValue={logged?.reps ?? ""}
            />
          </div>
        );
      })}

      <SubmitButton size="sm" variant="secondary" className="w-full" pendingLabel="Salvando...">
        Salvar séries
      </SubmitButton>
    </form>
  );
}

const BADGE: Record<ProgressionStatus, { label: string; className: string }> = {
  subir: { label: "subir carga", className: "border-primary/60 text-primary" },
  progredindo: { label: "progredindo", className: "border-blue-500/60 text-blue-400" },
  manter: { label: "manter", className: "border-border text-muted-foreground" },
  sem_dados: { label: "sem histórico", className: "border-border text-muted-foreground" },
};

function ProgressBadge({ status }: { status: ProgressionStatus }) {
  const b = BADGE[status];
  return (
    <span
      className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-widest ${b.className}`}
    >
      {b.label}
    </span>
  );
}
