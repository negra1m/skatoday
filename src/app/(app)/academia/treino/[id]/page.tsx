import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getWorkout, listWorkoutExercises } from "@/db/gym";
import { WEEKDAYS, type MuscleGroup } from "@/lib/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/ui/delete-button";
import {
  addWorkoutExerciseAction,
  deleteWorkoutAction,
  removeWorkoutExerciseAction,
  updateWorkoutAction,
  updateWorkoutExerciseAction,
} from "../../actions";

const GROUPS: MuscleGroup[] = [
  "peito",
  "costas",
  "ombro",
  "biceps",
  "triceps",
  "perna",
  "posterior",
  "panturrilha",
  "abdomen",
  "outro",
];

export default async function TreinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;

  const workout = getWorkout(s.profile.id, id);
  if (!workout) notFound();

  const exercises = listWorkoutExercises(workout.id);

  return (
    <div className="space-y-4">
      <Link href="/academia" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Academia
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Editar treino</h1>

      <Card>
        <CardContent className="pt-4">
          <form action={updateWorkoutAction} className="space-y-3">
            <input type="hidden" name="workoutId" value={workout.id} />
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={workout.name} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weekday">Dia fixo</Label>
              <Select id="weekday" name="weekday" defaultValue={workout.weekday ?? ""}>
                <option value="">Sem dia fixo</option>
                {WEEKDAYS.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton className="w-full">Salvar treino</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Exercícios ({exercises.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exercises.map(({ we, exercise }) => (
            <div key={we.id} className="space-y-2 border border-border bg-card px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm">{exercise.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {exercise.muscleGroup}
                  </div>
                </div>
                <DeleteButton
                  action={removeWorkoutExerciseAction}
                  id={we.id}
                  message={`Remover ${exercise.name} do treino?`}
                  extraFields={{ workoutId: workout.id }}
                />
              </div>

              <form action={updateWorkoutExerciseAction} className="flex items-end gap-2">
                <input type="hidden" name="workoutExerciseId" value={we.id} />
                <input type="hidden" name="workoutId" value={workout.id} />
                <NumField name="sets" label="Séries" defaultValue={we.sets} />
                <NumField name="repMin" label="Rep min" defaultValue={we.repMin} />
                <NumField name="repMax" label="Rep max" defaultValue={we.repMax} />
                <NumField
                  name="targetWeightKg"
                  label="Carga"
                  defaultValue={we.targetWeightKg}
                  step="0.5"
                />
                <SubmitButton size="sm" variant="secondary">
                  OK
                </SubmitButton>
              </form>

              {we.notes && <p className="text-xs text-muted-foreground">{we.notes}</p>}
            </div>
          ))}

          <details>
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              + Adicionar exercício
            </summary>
            <form action={addWorkoutExerciseAction} className="space-y-3 pt-3">
              <input type="hidden" name="workoutId" value={workout.id} />
              <div className="space-y-1">
                <Label htmlFor="name-new">Exercício</Label>
                <Input id="name-new" name="name" placeholder="Ex: Crucifixo inclinado" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="group">Grupo</Label>
                <Select id="group" name="group" defaultValue="outro">
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <NumField name="sets" label="Séries" defaultValue={3} />
                <NumField name="repMin" label="Rep min" defaultValue={8} />
                <NumField name="repMax" label="Rep max" defaultValue={12} />
              </div>
              <SubmitButton className="w-full">Adicionar</SubmitButton>
            </form>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <form action={deleteWorkoutAction}>
            <input type="hidden" name="id" value={workout.id} />
            <SubmitButton variant="destructive" className="w-full">
              Deletar treino
            </SubmitButton>
          </form>
          <p className="pt-2 text-xs text-muted-foreground">
            O histórico de séries continua salvo — só o treino sai da lista.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NumField({
  name,
  label,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  step?: string;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <Label htmlFor={`${name}-${label}`} className="text-[10px]">
        {label}
      </Label>
      <Input
        id={`${name}-${label}`}
        name={name}
        type="number"
        step={step}
        inputMode="numeric"
        defaultValue={defaultValue ?? ""}
      />
    </div>
  );
}
