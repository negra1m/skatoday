import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import {
  exerciseHistory,
  getGymSession,
  getWorkout,
  listSessionSets,
  listWorkoutExercises,
} from "@/db/gym";
import {
  PATTERN_LABEL,
  UNIT_LABEL,
  formatSetLine,
  progressReady,
  type Pattern,
  type ProgressReady,
  type Unit,
} from "@/lib/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { finishSessionAction, logExerciseSetsAction } from "../../actions";
import { schema } from "@/db/client";

type GymSetRow = typeof schema.gymSets.$inferSelect;

/** Valor comparável de uma série: reps OU segundos. */
function setValue(s: { reps: number | null; seconds: number | null }): number | null {
  return s.reps ?? s.seconds ?? null;
}

export default async function SessaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;

  const session = getGymSession(s.profile.id, id);
  if (!session) notFound();

  const workout = session.workoutId ? getWorkout(s.profile.id, session.workoutId) : null;
  const planned = workout ? listWorkoutExercises(workout.id) : [];
  const loggedSets = listSessionSets(session.id);

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
          exerciseId={exercise.id}
          name={exercise.name}
          pattern={exercise.pattern}
          unit={exercise.unit}
          execucao={exercise.execucao}
          errosComuns={exercise.errosComuns}
          regressao={exercise.regressao}
          progressao={exercise.progressao}
          sets={we.sets}
          repMin={we.repMin}
          repMax={we.repMax}
          notes={we.notes}
          loggedSets={loggedSets.filter((x) => x.exerciseId === exercise.id)}
        />
      ))}

      {planned.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Treino sem exercícios. Abra um bloco do nível atual na Academia.
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
                placeholder="40"
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
  exerciseId: string;
  name: string;
  pattern: Pattern | null;
  unit: Unit;
  execucao: string | null;
  errosComuns: string | null;
  regressao: string | null;
  progressao: string | null;
  sets: number;
  repMin: number;
  repMax: number;
  notes: string | null;
  loggedSets: GymSetRow[];
};

function ExerciseBlock(props: BlockProps) {
  // Histórico exclui a sessão atual: a dupla progressão olha o que já fechou antes de hoje.
  const history = exerciseHistory({
    profileId: props.profileId,
    exerciseId: props.exerciseId,
    excludeSessionId: props.sessionId,
    limit: 1,
  });
  const last = history[0];

  const ready = progressReady({
    sets: props.sets,
    max: props.repMax,
    logged: (last?.sets ?? []).map((x) => ({ value: setValue(x), rpe: x.rpe })),
  });

  const unitLabel = UNIT_LABEL[props.unit];
  const perSide = props.pattern === "unilateral";
  const doseRange = props.repMin === props.repMax ? `${props.repMax}` : `${props.repMin}–${props.repMax}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{props.name}</CardTitle>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {props.sets} × {doseRange} {unitLabel}
              {perSide ? "/lado" : ""}
              {props.pattern ? ` · ${PATTERN_LABEL[props.pattern]}` : ""}
            </p>
          </div>
          <ProgressBadge status={ready} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {last && (
          <p className="text-xs text-muted-foreground">
            Última ({last.date}): {formatSetLine(last.sets.map((x) => ({ value: setValue(x) })))}{" "}
            {unitLabel}
          </p>
        )}
        {props.notes && <p className="text-xs text-muted-foreground">{props.notes}</p>}

        {(props.execucao || props.regressao || props.progressao || props.errosComuns) && (
          <details className="border border-border bg-background/40 px-3 py-2">
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              Como fazer · regressão · progressão
            </summary>
            <div className="space-y-2 pt-2 text-xs">
              {props.execucao && <Field label="Execução" value={props.execucao} />}
              {props.errosComuns && <Field label="Erros comuns" value={props.errosComuns} />}
              {props.regressao && <Field label="Mais fácil" value={props.regressao} />}
              {props.progressao && <Field label="Mais difícil" value={props.progressao} />}
            </div>
          </details>
        )}

        <SetForm
          sessionId={props.sessionId}
          exerciseId={props.exerciseId}
          unit={props.unit}
          setCount={props.sets}
          loggedSets={props.loggedSets}
        />
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}: </span>
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}

function SetForm({
  sessionId,
  exerciseId,
  unit,
  setCount,
  loggedSets,
}: {
  sessionId: string;
  exerciseId: string;
  unit: Unit;
  setCount: number;
  loggedSets: GymSetRow[];
}) {
  const rows = Array.from({ length: setCount }, (_, i) => i + 1);
  const byNumber = new Map(loggedSets.map((x) => [x.setNumber, x]));
  const valueLabel = unit === "seg" ? "Segundos" : unit === "rounds" ? "Rounds" : "Reps";

  return (
    <form action={logExerciseSetsAction} className="space-y-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="unit" value={unit} />
      <input type="hidden" name="setCount" value={setCount} />

      <div className="flex gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="w-5" />
        <span className="flex-1">{valueLabel}</span>
        <span className="flex-1">RPE</span>
      </div>

      {rows.map((i) => {
        const logged = byNumber.get(i);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-xs text-muted-foreground">{i}</span>
            <Input
              name={`val-${i}`}
              type="number"
              inputMode="numeric"
              className="flex-1"
              defaultValue={(unit === "seg" ? logged?.seconds : logged?.reps) ?? ""}
            />
            <Input
              name={`rpe-${i}`}
              type="number"
              min={4}
              max={10}
              inputMode="numeric"
              className="flex-1"
              placeholder="7"
              defaultValue={logged?.rpe ?? ""}
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

const BADGE: Record<ProgressReady, { label: string; className: string }> = {
  pronto: { label: "pronto p/ dificultar", className: "border-primary/60 text-primary" },
  manter: { label: "manter", className: "border-border text-muted-foreground" },
  sem_dados: { label: "sem histórico", className: "border-border text-muted-foreground" },
};

function ProgressBadge({ status }: { status: ProgressReady }) {
  const b = BADGE[status];
  return (
    <span
      className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-widest ${b.className}`}
    >
      {b.label}
    </span>
  );
}
