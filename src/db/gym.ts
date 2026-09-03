import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { db, schema } from "./client";
import { PRESET_PROGRAM, type MuscleGroup } from "@/lib/gym";

type GymSet = typeof schema.gymSets.$inferSelect;

// ── Catálogo de exercícios ──────────────────────────────────────────────────

export function listExercises(profileId: string) {
  return db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.profileId, profileId))
    .orderBy(asc(schema.exercises.name))
    .all();
}

/** Reaproveita o exercício se já existir com o mesmo nome (case-insensitive). */
export function findOrCreateExercise(input: {
  profileId: string;
  name: string;
  group?: MuscleGroup;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("nome do exercício vazio");
  const existing = db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.profileId, input.profileId))
    .all()
    .find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return db
    .insert(schema.exercises)
    .values({ profileId: input.profileId, name, muscleGroup: input.group ?? "outro" })
    .returning()
    .get();
}

export function deleteExercise(input: { profileId: string; exerciseId: string }) {
  db.delete(schema.exercises)
    .where(
      and(eq(schema.exercises.id, input.exerciseId), eq(schema.exercises.profileId, input.profileId)),
    )
    .run();
}

// ── Treinos ─────────────────────────────────────────────────────────────────

export function listWorkouts(profileId: string, includeArchived = false) {
  const filter = includeArchived
    ? eq(schema.workouts.profileId, profileId)
    : and(eq(schema.workouts.profileId, profileId), isNull(schema.workouts.archivedAt));
  return db
    .select()
    .from(schema.workouts)
    .where(filter)
    .orderBy(asc(schema.workouts.sortOrder), asc(schema.workouts.createdAt))
    .all();
}

export function getWorkout(profileId: string, workoutId: string) {
  return db
    .select()
    .from(schema.workouts)
    .where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.profileId, profileId)))
    .get();
}

/** Exercícios de um treino, já com os dados do catálogo, na ordem definida. */
export function listWorkoutExercises(workoutId: string) {
  return db
    .select({ we: schema.workoutExercises, exercise: schema.exercises })
    .from(schema.workoutExercises)
    .innerJoin(schema.exercises, eq(schema.exercises.id, schema.workoutExercises.exerciseId))
    .where(eq(schema.workoutExercises.workoutId, workoutId))
    .orderBy(asc(schema.workoutExercises.sortOrder))
    .all();
}

export function createWorkout(input: { profileId: string; name: string; weekday?: number | null }) {
  const name = input.name.trim();
  if (!name) throw new Error("nome do treino vazio");
  const count = listWorkouts(input.profileId, true).length;
  return db
    .insert(schema.workouts)
    .values({
      profileId: input.profileId,
      name,
      weekday: input.weekday ?? null,
      sortOrder: count,
    })
    .returning()
    .get();
}

export function updateWorkout(input: {
  profileId: string;
  workoutId: string;
  name?: string;
  weekday?: number | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.weekday !== undefined) patch.weekday = input.weekday;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.workouts)
    .set(patch)
    .where(
      and(eq(schema.workouts.id, input.workoutId), eq(schema.workouts.profileId, input.profileId)),
    )
    .run();
}

export function deleteWorkout(input: { profileId: string; workoutId: string }) {
  db.delete(schema.workouts)
    .where(
      and(eq(schema.workouts.id, input.workoutId), eq(schema.workouts.profileId, input.profileId)),
    )
    .run();
}

export function addWorkoutExercise(input: {
  profileId: string;
  workoutId: string;
  name: string;
  group?: MuscleGroup;
  sets: number;
  repMin: number;
  repMax: number;
}) {
  const workout = getWorkout(input.profileId, input.workoutId);
  if (!workout) throw new Error("treino não encontrado");
  const exercise = findOrCreateExercise({
    profileId: input.profileId,
    name: input.name,
    group: input.group,
  });
  const count = listWorkoutExercises(input.workoutId).length;
  return db
    .insert(schema.workoutExercises)
    .values({
      workoutId: input.workoutId,
      exerciseId: exercise.id,
      sets: input.sets,
      repMin: input.repMin,
      repMax: input.repMax,
      sortOrder: count,
    })
    .returning()
    .get();
}

export function updateWorkoutExercise(input: {
  profileId: string;
  workoutExerciseId: string;
  sets?: number;
  repMin?: number;
  repMax?: number;
  targetWeightKg?: number | null;
  notes?: string | null;
}) {
  if (!workoutExerciseOwned(input.profileId, input.workoutExerciseId)) return;
  const patch: Record<string, unknown> = {};
  if (input.sets !== undefined) patch.sets = input.sets;
  if (input.repMin !== undefined) patch.repMin = input.repMin;
  if (input.repMax !== undefined) patch.repMax = input.repMax;
  if (input.targetWeightKg !== undefined) patch.targetWeightKg = input.targetWeightKg;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.workoutExercises)
    .set(patch)
    .where(eq(schema.workoutExercises.id, input.workoutExerciseId))
    .run();
}

export function removeWorkoutExercise(input: { profileId: string; workoutExerciseId: string }) {
  if (!workoutExerciseOwned(input.profileId, input.workoutExerciseId)) return;
  db.delete(schema.workoutExercises)
    .where(eq(schema.workoutExercises.id, input.workoutExerciseId))
    .run();
}

/** Confirma que o workout_exercise pertence a um treino do perfil. */
function workoutExerciseOwned(profileId: string, workoutExerciseId: string) {
  return db
    .select({ we: schema.workoutExercises })
    .from(schema.workoutExercises)
    .innerJoin(schema.workouts, eq(schema.workouts.id, schema.workoutExercises.workoutId))
    .where(
      and(
        eq(schema.workoutExercises.id, workoutExerciseId),
        eq(schema.workouts.profileId, profileId),
      ),
    )
    .get();
}

// ── Sessões ─────────────────────────────────────────────────────────────────

export function listGymSessions(profileId: string, limit = 60) {
  return db
    .select({ session: schema.gymSessions, workout: schema.workouts })
    .from(schema.gymSessions)
    .leftJoin(schema.workouts, eq(schema.workouts.id, schema.gymSessions.workoutId))
    .where(eq(schema.gymSessions.profileId, profileId))
    .orderBy(desc(schema.gymSessions.date))
    .limit(limit)
    .all();
}

export function getGymSession(profileId: string, sessionId: string) {
  return db
    .select()
    .from(schema.gymSessions)
    .where(and(eq(schema.gymSessions.id, sessionId), eq(schema.gymSessions.profileId, profileId)))
    .get();
}

export function getSessionByDate(profileId: string, date: string) {
  return db
    .select()
    .from(schema.gymSessions)
    .where(and(eq(schema.gymSessions.profileId, profileId), eq(schema.gymSessions.date, date)))
    .get();
}

/**
 * Só existe uma sessão de academia por dia (índice único), então abrir o
 * treino do dia duas vezes reaproveita a mesma sessão em vez de duplicar.
 */
export function startSession(input: { profileId: string; date: string; workoutId: string | null }) {
  const existing = getSessionByDate(input.profileId, input.date);
  if (existing) {
    if (input.workoutId && existing.workoutId !== input.workoutId) {
      db.update(schema.gymSessions)
        .set({ workoutId: input.workoutId })
        .where(eq(schema.gymSessions.id, existing.id))
        .run();
      return { ...existing, workoutId: input.workoutId };
    }
    return existing;
  }
  return db
    .insert(schema.gymSessions)
    .values({ profileId: input.profileId, date: input.date, workoutId: input.workoutId })
    .returning()
    .get();
}

export function updateGymSession(input: {
  profileId: string;
  sessionId: string;
  durationMinutes?: number | null;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.gymSessions)
    .set(patch)
    .where(
      and(
        eq(schema.gymSessions.id, input.sessionId),
        eq(schema.gymSessions.profileId, input.profileId),
      ),
    )
    .run();
}

export function deleteGymSession(input: { profileId: string; sessionId: string }) {
  db.delete(schema.gymSessions)
    .where(
      and(
        eq(schema.gymSessions.id, input.sessionId),
        eq(schema.gymSessions.profileId, input.profileId),
      ),
    )
    .run();
}

// ── Séries ──────────────────────────────────────────────────────────────────

export function listSessionSets(sessionId: string) {
  return db
    .select()
    .from(schema.gymSets)
    .where(eq(schema.gymSets.sessionId, sessionId))
    .orderBy(asc(schema.gymSets.setNumber))
    .all();
}

/** Regrava a série (mesmo exercício + número) em vez de acumular duplicata. */
export function logSet(input: {
  profileId: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
}) {
  const session = getGymSession(input.profileId, input.sessionId);
  if (!session) throw new Error("sessão não encontrada");

  const existing = db
    .select()
    .from(schema.gymSets)
    .where(
      and(
        eq(schema.gymSets.sessionId, input.sessionId),
        eq(schema.gymSets.exerciseId, input.exerciseId),
        eq(schema.gymSets.setNumber, input.setNumber),
      ),
    )
    .get();

  // Série esvaziada some do histórico — senão vira zero e polui a progressão.
  if (input.reps == null && input.weightKg == null) {
    if (existing) db.delete(schema.gymSets).where(eq(schema.gymSets.id, existing.id)).run();
    return;
  }

  if (existing) {
    db.update(schema.gymSets)
      .set({ weightKg: input.weightKg, reps: input.reps })
      .where(eq(schema.gymSets.id, existing.id))
      .run();
    return;
  }

  db.insert(schema.gymSets)
    .values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      weightKg: input.weightKg,
      reps: input.reps,
    })
    .run();
}

/**
 * Séries de um exercício agrupadas por sessão, da mais recente pra mais
 * antiga. Alimenta a regra de progressão — por isso exclui a sessão atual.
 */
export function exerciseHistory(input: {
  profileId: string;
  exerciseId: string;
  excludeSessionId?: string;
  limit?: number;
}): Array<{ date: string; sets: GymSet[] }> {
  const base = and(
    eq(schema.gymSessions.profileId, input.profileId),
    eq(schema.gymSets.exerciseId, input.exerciseId),
  );
  const rows = db
    .select({ set: schema.gymSets, date: schema.gymSessions.date, sessionId: schema.gymSessions.id })
    .from(schema.gymSets)
    .innerJoin(schema.gymSessions, eq(schema.gymSessions.id, schema.gymSets.sessionId))
    .where(input.excludeSessionId ? and(base, ne(schema.gymSessions.id, input.excludeSessionId)) : base)
    .orderBy(desc(schema.gymSessions.date), asc(schema.gymSets.setNumber))
    .all();

  const bySession = new Map<string, { date: string; sets: GymSet[] }>();
  for (const r of rows) {
    const entry = bySession.get(r.sessionId) ?? { date: r.date, sets: [] };
    entry.sets.push(r.set);
    bySession.set(r.sessionId, entry);
  }
  return [...bySession.values()].slice(0, input.limit ?? 8);
}

// ── Seed do programa inicial ────────────────────────────────────────────────

/**
 * Cria o programa base na primeira visita. Idempotente: se o perfil já tem
 * qualquer treino, não faz nada — nunca sobrescreve edição do usuário.
 */
export function seedProgramIfEmpty(profileId: string) {
  if (listWorkouts(profileId, true).length > 0) return false;

  db.transaction((tx) => {
    PRESET_PROGRAM.forEach((preset, wIndex) => {
      const workout = tx
        .insert(schema.workouts)
        .values({ profileId, name: preset.name, weekday: preset.weekday, sortOrder: wIndex })
        .returning()
        .get();

      preset.exercises.forEach((ex, eIndex) => {
        // O catálogo é compartilhado entre treinos: "Barra fixa" aparece nos
        // três, mas é o mesmo exercício — é isso que mantém o histórico de
        // progressão contínuo em vez de fatiado por treino.
        let exercise = tx
          .select()
          .from(schema.exercises)
          .where(eq(schema.exercises.profileId, profileId))
          .all()
          .find((e) => e.name.toLowerCase() === ex.name.toLowerCase());

        if (!exercise) {
          exercise = tx
            .insert(schema.exercises)
            .values({ profileId, name: ex.name, muscleGroup: ex.group })
            .returning()
            .get();
        }

        tx.insert(schema.workoutExercises)
          .values({
            workoutId: workout.id,
            exerciseId: exercise.id,
            sets: ex.sets,
            repMin: ex.repMin,
            repMax: ex.repMax,
            sortOrder: eIndex,
            notes: ex.notes ?? null,
          })
          .run();
      });
    });
  });

  return true;
}
