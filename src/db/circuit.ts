import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "./client";

// ── Config de lembrete ───────────────────────────────────────────────────────

export function getCircuitConfig(profileId: string) {
  return db
    .select()
    .from(schema.workoutCircuitConfigs)
    .where(eq(schema.workoutCircuitConfigs.profileId, profileId))
    .get();
}

export function ensureCircuitConfig(profileId: string) {
  const cfg = getCircuitConfig(profileId);
  if (cfg) return cfg;
  return db
    .insert(schema.workoutCircuitConfigs)
    .values({ profileId })
    .returning()
    .get();
}

export function updateCircuitConfig(input: {
  profileId: string;
  notificationsEnabled?: boolean;
  windowStart?: string;
  windowEnd?: string;
  remindersPerDay?: number;
}) {
  ensureCircuitConfig(input.profileId);
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const k of ["notificationsEnabled", "windowStart", "windowEnd", "remindersPerDay"] as const) {
    if (input[k] !== undefined) patch[k] = input[k];
  }
  db.update(schema.workoutCircuitConfigs)
    .set(patch)
    .where(eq(schema.workoutCircuitConfigs.profileId, input.profileId))
    .run();
}

// ── Check do dia ─────────────────────────────────────────────────────────────

export function getCircuitLogForDate(profileId: string, date: string) {
  return db
    .select()
    .from(schema.workoutCircuitLogs)
    .where(and(eq(schema.workoutCircuitLogs.profileId, profileId), eq(schema.workoutCircuitLogs.date, date)))
    .get();
}

/** Upsert do treino do dia. Marca done e, opcionalmente, voltas/duração/nota. */
export function setCircuitLog(input: {
  profileId: string;
  date: string;
  done?: boolean;
  rounds?: number | null;
  durationMinutes?: number | null;
  notes?: string | null;
}) {
  const existing = getCircuitLogForDate(input.profileId, input.date);
  if (!existing) {
    return db
      .insert(schema.workoutCircuitLogs)
      .values({
        profileId: input.profileId,
        date: input.date,
        done: input.done ?? true,
        rounds: input.rounds ?? null,
        durationMinutes: input.durationMinutes ?? null,
        notes: input.notes ?? null,
      })
      .returning()
      .get();
  }
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const k of ["done", "rounds", "durationMinutes", "notes"] as const) {
    if (input[k] !== undefined) patch[k] = input[k];
  }
  db.update(schema.workoutCircuitLogs)
    .set(patch)
    .where(eq(schema.workoutCircuitLogs.id, existing.id))
    .run();
  return getCircuitLogForDate(input.profileId, input.date);
}

/** Alterna o "fiz hoje": sem registro ou não-feito → feito; feito → desfaz. */
export function toggleCircuitDone(profileId: string, date: string): boolean {
  const existing = getCircuitLogForDate(profileId, date);
  if (!existing) {
    db.insert(schema.workoutCircuitLogs).values({ profileId, date, done: true }).run();
    return true;
  }
  const next = !existing.done;
  db.update(schema.workoutCircuitLogs)
    .set({ done: next, updatedAt: new Date().toISOString() })
    .where(eq(schema.workoutCircuitLogs.id, existing.id))
    .run();
  return next;
}

export function listCircuitHistory(profileId: string, days = 30) {
  return db
    .select()
    .from(schema.workoutCircuitLogs)
    .where(eq(schema.workoutCircuitLogs.profileId, profileId))
    .orderBy(desc(schema.workoutCircuitLogs.date))
    .limit(days)
    .all();
}

/** Total acumulado de dias com treino feito (meta da base: 90). */
export function countCircuitDone(profileId: string): number {
  return db
    .select({ id: schema.workoutCircuitLogs.id })
    .from(schema.workoutCircuitLogs)
    .where(and(eq(schema.workoutCircuitLogs.profileId, profileId), eq(schema.workoutCircuitLogs.done, true)))
    .all().length;
}

/** Datas (YYYY-MM-DD) com treino feito desde `sinceDate`, pra streak e mapa. */
export function listCircuitDoneDatesSince(profileId: string, sinceDate: string): string[] {
  return db
    .select({ date: schema.workoutCircuitLogs.date })
    .from(schema.workoutCircuitLogs)
    .where(
      and(
        eq(schema.workoutCircuitLogs.profileId, profileId),
        eq(schema.workoutCircuitLogs.done, true),
        gte(schema.workoutCircuitLogs.date, sinceDate),
      ),
    )
    .all()
    .map((r) => r.date);
}
