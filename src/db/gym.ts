import { and, asc, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { db, schema } from "./client";
import {
  BENCHMARKS,
  EXERCISE_BY_KEY,
  EXERCISES,
  LEVELS,
  MAX_LEVEL,
  PROGRAMS,
  TEST_BLOCK,
  type ExDef,
} from "@/lib/gym";

type GymSet = typeof schema.gymSets.$inferSelect;

// ── Nível do perfil ─────────────────────────────────────────────────────────

export function getProfileLevel(profileId: string): number {
  const row = db
    .select({ level: schema.profiles.calisthenicsLevel })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, profileId))
    .get();
  return row?.level ?? 0;
}

/** Sobe/desce de nível. Clampa em 0..MAX_LEVEL. */
export function setCalisthenicsLevel(profileId: string, level: number) {
  const clamped = Math.max(0, Math.min(MAX_LEVEL, Math.round(level)));
  db.update(schema.profiles)
    .set({ calisthenicsLevel: clamped })
    .where(eq(schema.profiles.id, profileId))
    .run();
  return clamped;
}

// ── Catálogo de exercícios ──────────────────────────────────────────────────

export function listExercises(profileId: string) {
  return db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.profileId, profileId))
    .orderBy(asc(schema.exercises.name))
    .all();
}

// ── Treinos ─────────────────────────────────────────────────────────────────

/** Treinos (blocos) de um nível, na ordem de bloco. */
export function listWorkoutsForLevel(profileId: string, level: number) {
  return db
    .select()
    .from(schema.workouts)
    .where(
      and(
        eq(schema.workouts.profileId, profileId),
        eq(schema.workouts.level, level),
        isNull(schema.workouts.archivedAt),
      ),
    )
    .orderBy(asc(schema.workouts.sortOrder))
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

/**
 * True se o programa de calistenia já foi semeado pra esse perfil. Exige
 * treino com `level` preenchido — treinos antigos de musculação (level nulo)
 * não contam, então o perfil vê o botão que apaga o antigo e carrega a calistenia.
 */
export function hasProgram(profileId: string): boolean {
  const row = db
    .select({ id: schema.workouts.id })
    .from(schema.workouts)
    .where(
      and(
        eq(schema.workouts.profileId, profileId),
        isNotNull(schema.workouts.level),
        isNull(schema.workouts.archivedAt),
      ),
    )
    .get();
  return !!row;
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

/**
 * Regrava a série (mesmo exercício + número) em vez de acumular duplicata.
 * `reps` OU `seconds` conforme a unidade do exercício; `rpe` é o esforço 4..10.
 */
export function logSet(input: {
  profileId: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  seconds: number | null;
  rpe: number | null;
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

  // Série vazia some do histórico — senão vira zero e polui a progressão.
  if (input.reps == null && input.seconds == null && input.rpe == null) {
    if (existing) db.delete(schema.gymSets).where(eq(schema.gymSets.id, existing.id)).run();
    return;
  }

  if (existing) {
    db.update(schema.gymSets)
      .set({ reps: input.reps, seconds: input.seconds, rpe: input.rpe })
      .where(eq(schema.gymSets.id, existing.id))
      .run();
    return;
  }

  db.insert(schema.gymSets)
    .values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      reps: input.reps,
      seconds: input.seconds,
      rpe: input.rpe,
    })
    .run();
}

/**
 * Séries de um exercício agrupadas por sessão, da mais recente pra mais
 * antiga. Alimenta a dupla progressão — por isso exclui a sessão atual.
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

// ── Seed do programa de calistenia ──────────────────────────────────────────

/**
 * Apaga o que existir de academia do perfil (treinos, sessões, exercícios) e
 * semeia a biblioteca de calistenia + todos os programas por nível. Zera o
 * nível pra 0 (Reinício). Começar limpo — decisão do Vini (2026-10-27).
 */
export function seedCalisthenicsProgram(profileId: string) {
  db.transaction((tx) => {
    // Limpa (cascata cuida de gym_sets e workout_exercises).
    tx.delete(schema.gymSessions).where(eq(schema.gymSessions.profileId, profileId)).run();
    tx.delete(schema.workouts).where(eq(schema.workouts.profileId, profileId)).run();
    tx.delete(schema.exercises).where(eq(schema.exercises.profileId, profileId)).run();

    // Biblioteca de exercícios → mapa key → id.
    const idByKey = new Map<string, string>();
    for (const ex of EXERCISES) {
      const row = tx
        .insert(schema.exercises)
        .values({
          profileId,
          name: ex.name,
          pattern: ex.pattern,
          minLevel: ex.minLevel,
          maxLevel: ex.maxLevel,
          unit: ex.unit,
          execucao: ex.execucao,
          errosComuns: ex.errosComuns,
          regressao: ex.regressao,
          progressao: ex.progressao,
        })
        .returning()
        .get();
      idByKey.set(ex.key, row.id);
    }

    // Programas por nível → workouts (um por bloco) + workout_exercises.
    let sort = 0;
    for (const program of PROGRAMS) {
      for (const block of program.blocks) {
        const workout = tx
          .insert(schema.workouts)
          .values({
            profileId,
            name: block.title,
            level: program.level,
            block: block.block,
            sortOrder: sort++,
          })
          .returning()
          .get();

        block.items.forEach((item, i) => {
          const exerciseId = idByKey.get(item.key);
          if (!exerciseId) return;
          tx.insert(schema.workoutExercises)
            .values({
              workoutId: workout.id,
              exerciseId,
              sets: item.sets,
              repMin: item.min,
              repMax: item.max,
              notes: item.note ?? null,
              sortOrder: i,
            })
            .run();
        });
      }

      // Teste de passagem do nível → treino com bloco "T", 1 série por meta.
      const bench = BENCHMARKS[program.level];
      if (bench && bench.length) {
        const test = tx
          .insert(schema.workouts)
          .values({
            profileId,
            name: `Teste de passagem — ${LEVELS[program.level].name}`,
            level: program.level,
            block: TEST_BLOCK,
            sortOrder: 100 + program.level,
          })
          .returning()
          .get();
        bench.forEach((b, i) => {
          const exerciseId = idByKey.get(b.key);
          if (!exerciseId) return;
          tx.insert(schema.workoutExercises)
            .values({
              workoutId: test.id,
              exerciseId,
              sets: 1,
              repMin: b.target,
              repMax: b.target,
              sortOrder: i,
            })
            .run();
        });
      }
    }

    tx.update(schema.profiles)
      .set({ calisthenicsLevel: 0 })
      .where(eq(schema.profiles.id, profileId))
      .run();
  });

  return true;
}

// ── Teste de passagem: consulta e avaliação ─────────────────────────────────

export function getTestWorkout(profileId: string, level: number) {
  return db
    .select()
    .from(schema.workouts)
    .where(
      and(
        eq(schema.workouts.profileId, profileId),
        eq(schema.workouts.level, level),
        eq(schema.workouts.block, TEST_BLOCK),
        isNull(schema.workouts.archivedAt),
      ),
    )
    .get();
}

function latestSessionForWorkout(profileId: string, workoutId: string) {
  return db
    .select()
    .from(schema.gymSessions)
    .where(
      and(eq(schema.gymSessions.profileId, profileId), eq(schema.gymSessions.workoutId, workoutId)),
    )
    .orderBy(desc(schema.gymSessions.date))
    .get();
}

export type TestItem = {
  name: string;
  target: number;
  unit: "reps" | "seg" | "rounds";
  best: number | null;
  ok: boolean;
};
export type TestResult = {
  workoutId: string;
  passed: boolean;
  hasAttempt: boolean;
  date: string | null;
  items: TestItem[];
};

/**
 * Resultado do teste de passagem do nível, a partir da sessão de teste mais
 * recente. `passed` só quando TODAS as metas foram batidas. null se o nível
 * não tem teste (Master).
 */
export function testResult(profileId: string, level: number): TestResult | null {
  const tw = getTestWorkout(profileId, level);
  if (!tw) return null;
  const planned = listWorkoutExercises(tw.id);
  const session = latestSessionForWorkout(profileId, tw.id);
  const sets = session ? listSessionSets(session.id) : [];

  const items: TestItem[] = planned.map(({ we, exercise }) => {
    const best = sets
      .filter((s) => s.exerciseId === exercise.id)
      .reduce((m, s) => Math.max(m, s.reps ?? s.seconds ?? 0), 0);
    return {
      name: exercise.name,
      target: we.repMax,
      unit: exercise.unit,
      best: session ? best : null,
      ok: best >= we.repMax,
    };
  });

  return {
    workoutId: tw.id,
    passed: !!session && items.length > 0 && items.every((i) => i.ok),
    hasAttempt: !!session,
    date: session?.date ?? null,
    items,
  };
}

/** Acha (ou cria) um exercício pelo nome, semeando os metadados de calistenia. */
function findOrCreateExerciseByDef(profileId: string, def: ExDef): string {
  const existing = db
    .select({ id: schema.exercises.id })
    .from(schema.exercises)
    .where(and(eq(schema.exercises.profileId, profileId), eq(schema.exercises.name, def.name)))
    .get();
  if (existing) return existing.id;
  const row = db
    .insert(schema.exercises)
    .values({
      profileId,
      name: def.name,
      pattern: def.pattern,
      minLevel: def.minLevel,
      maxLevel: def.maxLevel,
      unit: def.unit,
      execucao: def.execucao,
      errosComuns: def.errosComuns,
      regressao: def.regressao,
      progressao: def.progressao,
    })
    .returning()
    .get();
  return row.id;
}

/**
 * Garante que os testes de passagem existem (perfis semeados antes dos testes
 * entrarem). Idempotente e não destrutivo: só cria o que faltar.
 */
export function ensureTestWorkouts(profileId: string) {
  for (let level = 0; level <= MAX_LEVEL; level++) {
    const bench = BENCHMARKS[level];
    if (!bench || !bench.length) continue;
    if (getTestWorkout(profileId, level)) continue;

    const test = db
      .insert(schema.workouts)
      .values({
        profileId,
        name: `Teste de passagem — ${LEVELS[level].name}`,
        level,
        block: TEST_BLOCK,
        sortOrder: 100 + level,
      })
      .returning()
      .get();

    bench.forEach((b, i) => {
      const def = EXERCISE_BY_KEY[b.key];
      if (!def) return;
      const exerciseId = findOrCreateExerciseByDef(profileId, def);
      db.insert(schema.workoutExercises)
        .values({
          workoutId: test.id,
          exerciseId,
          sets: 1,
          repMin: b.target,
          repMax: b.target,
          sortOrder: i,
        })
        .run();
    });
  }
}
