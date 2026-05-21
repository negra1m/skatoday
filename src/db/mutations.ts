import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "./client";
import { calcXP, determineStatus } from "@/lib/xp";

export function upsertSession(input: {
  profileId: string;
  date: string;
  durationMinutes?: number | null;
  location?: string | null;
  sessionType?: schema.SkateSession["sessionType"];
  feeling?: number | null;
  confidence?: number | null;
  pain?: number | null;
  flowState?: schema.SkateSession["flowState"];
  notes?: string | null;
}) {
  const existing = db
    .select()
    .from(schema.skateSessions)
    .where(and(eq(schema.skateSessions.profileId, input.profileId), eq(schema.skateSessions.date, input.date)))
    .get();
  if (existing) {
    db.update(schema.skateSessions)
      .set({
        durationMinutes: input.durationMinutes ?? existing.durationMinutes,
        location: input.location ?? existing.location,
        sessionType: input.sessionType ?? existing.sessionType,
        feeling: input.feeling ?? existing.feeling,
        confidence: input.confidence ?? existing.confidence,
        pain: input.pain ?? existing.pain,
        flowState: input.flowState ?? existing.flowState,
        notes: input.notes ?? existing.notes,
      })
      .where(eq(schema.skateSessions.id, existing.id))
      .run();
    return existing.id;
  }
  const row = db
    .insert(schema.skateSessions)
    .values({
      profileId: input.profileId,
      date: input.date,
      durationMinutes: input.durationMinutes ?? null,
      location: input.location ?? null,
      sessionType: input.sessionType ?? null,
      feeling: input.feeling ?? null,
      confidence: input.confidence ?? null,
      pain: input.pain ?? null,
      flowState: input.flowState ?? null,
      notes: input.notes ?? null,
    })
    .returning()
    .get();
  return row.id;
}

export function logSessionTrick(input: {
  profileId: string;
  sessionId: string;
  trickId: string;
  attempts: number;
  lands: number;
  bestStreak: number;
  notes?: string | null;
}) {
  const trick = db
    .select()
    .from(schema.tricks)
    .where(and(eq(schema.tricks.id, input.trickId), eq(schema.tricks.profileId, input.profileId)))
    .get();
  if (!trick) throw new Error("trick não encontrada");

  const today = db
    .select()
    .from(schema.skateSessions)
    .where(eq(schema.skateSessions.id, input.sessionId))
    .get();
  if (!today) throw new Error("sessão não encontrada");

  const lastRunRow = db
    .select({ date: schema.skateSessions.date })
    .from(schema.sessionTricks)
    .innerJoin(schema.skateSessions, eq(schema.skateSessions.id, schema.sessionTricks.sessionId))
    .where(eq(schema.sessionTricks.trickId, input.trickId))
    .orderBy(desc(schema.skateSessions.date))
    .get();

  const daysAway = lastRunRow
    ? Math.floor(
        (Date.parse(today.date) - Date.parse(lastRunRow.date)) / (1000 * 60 * 60 * 24),
      )
    : 999;
  const isFirstToday = !lastRunRow || lastRunRow.date !== today.date;
  const isBaseRun = input.bestStreak >= trick.baseRequirement;
  const misses = Math.max(0, input.attempts - input.lands);

  const xp = calcXP({
    attempts: input.attempts,
    lands: input.lands,
    bestStreak: input.bestStreak,
    isFirstToday,
    daysAway,
  });

  db.insert(schema.sessionTricks)
    .values({
      sessionId: input.sessionId,
      trickId: input.trickId,
      attempts: input.attempts,
      lands: input.lands,
      misses,
      bestStreak: input.bestStreak,
      isBaseRun,
      notes: input.notes ?? null,
    })
    .run();

  const newXp = trick.totalXp + xp;

  const history = db
    .select({
      bestStreak: schema.sessionTricks.bestStreak,
      isBaseRun: schema.sessionTricks.isBaseRun,
      date: schema.skateSessions.date,
    })
    .from(schema.sessionTricks)
    .innerJoin(schema.skateSessions, eq(schema.skateSessions.id, schema.sessionTricks.sessionId))
    .where(eq(schema.sessionTricks.trickId, input.trickId))
    .all();

  const status = determineStatus({ totalXp: newXp, history });

  db.update(schema.tricks)
    .set({ totalXp: newXp, status })
    .where(eq(schema.tricks.id, input.trickId))
    .run();

  return { xpGained: xp, newTotalXp: newXp, newStatus: status, isBaseRun };
}

export function createTrick(input: {
  profileId: string;
  name: string;
  category: schema.NewTrick["category"];
  stance: schema.NewTrick["stance"];
  level: number;
}) {
  return db
    .insert(schema.tricks)
    .values({
      profileId: input.profileId,
      name: input.name,
      category: input.category,
      stance: input.stance,
      level: input.level,
      status: "descobrindo",
    })
    .returning()
    .get();
}

export function logBody(input: {
  profileId: string;
  date: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  visceralFat?: number | null;
  muscleMassKg?: number | null;
  waterPct?: number | null;
  energy?: number | null;
  mood?: number | null;
  sleepHours?: number | null;
  notes?: string | null;
}) {
  const existing = db
    .select()
    .from(schema.bodyLogs)
    .where(and(eq(schema.bodyLogs.profileId, input.profileId), eq(schema.bodyLogs.date, input.date)))
    .get();
  if (existing) {
    db.update(schema.bodyLogs)
      .set({
        weightKg: input.weightKg ?? existing.weightKg,
        bodyFatPct: input.bodyFatPct ?? existing.bodyFatPct,
        visceralFat: input.visceralFat ?? existing.visceralFat,
        muscleMassKg: input.muscleMassKg ?? existing.muscleMassKg,
        waterPct: input.waterPct ?? existing.waterPct,
        energy: input.energy ?? existing.energy,
        mood: input.mood ?? existing.mood,
        sleepHours: input.sleepHours ?? existing.sleepHours,
        notes: input.notes ?? existing.notes,
      })
      .where(eq(schema.bodyLogs.id, existing.id))
      .run();
    return existing.id;
  }
  const row = db.insert(schema.bodyLogs).values({ ...input }).returning().get();
  return row.id;
}

export function logRun(input: {
  profileId: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  type: schema.Run["type"];
  notes?: string | null;
}) {
  const pace = computePace(input.distanceKm, input.durationMinutes);
  const row = db
    .insert(schema.runs)
    .values({
      profileId: input.profileId,
      date: input.date,
      distanceKm: input.distanceKm,
      durationMinutes: input.durationMinutes,
      pace,
      type: input.type,
      notes: input.notes ?? null,
    })
    .returning()
    .get();
  return row.id;
}

export function logJiu(input: {
  profileId: string;
  date: string;
  durationMinutes: number;
  rolls: number;
  intensity: number;
  notes?: string | null;
}) {
  const row = db
    .insert(schema.jiuSessions)
    .values({
      profileId: input.profileId,
      date: input.date,
      durationMinutes: input.durationMinutes,
      rolls: input.rolls,
      intensity: input.intensity,
      notes: input.notes ?? null,
    })
    .returning()
    .get();
  return row.id;
}

export function toggleRoutine(input: { profileId: string; date: string; taskKey: string; done: boolean }) {
  const existing = db
    .select()
    .from(schema.routineChecks)
    .where(
      and(
        eq(schema.routineChecks.profileId, input.profileId),
        eq(schema.routineChecks.date, input.date),
        eq(schema.routineChecks.taskKey, input.taskKey),
      ),
    )
    .get();
  if (existing) {
    db.update(schema.routineChecks)
      .set({ done: input.done })
      .where(eq(schema.routineChecks.id, existing.id))
      .run();
    return existing.id;
  }
  const row = db
    .insert(schema.routineChecks)
    .values({ profileId: input.profileId, date: input.date, taskKey: input.taskKey, done: input.done })
    .returning()
    .get();
  return row.id;
}

export function createTask(input: {
  profileId: string;
  title: string;
  project: string;
  priority?: schema.NewTask["priority"];
  deadline?: string | null;
  notes?: string | null;
}) {
  return db
    .insert(schema.tasks)
    .values({
      profileId: input.profileId,
      title: input.title.trim(),
      project: input.project,
      priority: input.priority ?? "next",
      deadline: input.deadline ?? null,
      notes: input.notes ?? null,
    })
    .returning()
    .get();
}

export function updateTask(input: {
  profileId: string;
  taskId: string;
  title?: string;
  project?: string;
  priority?: schema.Task["priority"];
  deadline?: string | null;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.project !== undefined) patch.project = input.project;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.deadline !== undefined) patch.deadline = input.deadline;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.tasks)
    .set(patch)
    .where(and(eq(schema.tasks.id, input.taskId), eq(schema.tasks.profileId, input.profileId)))
    .run();
}

export function toggleTaskDone(input: { profileId: string; taskId: string; done: boolean }) {
  db.update(schema.tasks)
    .set({
      done: input.done,
      completedAt: input.done ? new Date().toISOString() : null,
    })
    .where(and(eq(schema.tasks.id, input.taskId), eq(schema.tasks.profileId, input.profileId)))
    .run();
}

export function deleteTask(input: { profileId: string; taskId: string }) {
  db.delete(schema.tasks)
    .where(and(eq(schema.tasks.id, input.taskId), eq(schema.tasks.profileId, input.profileId)))
    .run();
}

export function deleteSkateSession(input: { profileId: string; sessionId: string }) {
  db.delete(schema.skateSessions)
    .where(and(eq(schema.skateSessions.id, input.sessionId), eq(schema.skateSessions.profileId, input.profileId)))
    .run();
}

export function deleteTrick(input: { profileId: string; trickId: string }) {
  // ownership check + cascade leva session_tricks junto
  db.delete(schema.tricks)
    .where(and(eq(schema.tricks.id, input.trickId), eq(schema.tricks.profileId, input.profileId)))
    .run();
}

export function deleteSessionTrick(input: { profileId: string; sessionTrickId: string }) {
  const row = db
    .select({ st: schema.sessionTricks, session: schema.skateSessions })
    .from(schema.sessionTricks)
    .innerJoin(schema.skateSessions, eq(schema.skateSessions.id, schema.sessionTricks.sessionId))
    .where(eq(schema.sessionTricks.id, input.sessionTrickId))
    .get();
  if (!row || row.session.profileId !== input.profileId) return;
  db.delete(schema.sessionTricks).where(eq(schema.sessionTricks.id, input.sessionTrickId)).run();
  recomputeTrickXp(row.st.trickId);
}

function recomputeTrickXp(trickId: string) {
  const trick = db.select().from(schema.tricks).where(eq(schema.tricks.id, trickId)).get();
  if (!trick) return;
  const history = db
    .select({
      bestStreak: schema.sessionTricks.bestStreak,
      isBaseRun: schema.sessionTricks.isBaseRun,
      attempts: schema.sessionTricks.attempts,
      lands: schema.sessionTricks.lands,
      date: schema.skateSessions.date,
    })
    .from(schema.sessionTricks)
    .innerJoin(schema.skateSessions, eq(schema.skateSessions.id, schema.sessionTricks.sessionId))
    .where(eq(schema.sessionTricks.trickId, trickId))
    .all();
  const totalXp = history.reduce((acc, h) => acc + h.attempts + h.lands * 5 + (h.bestStreak >= 10 ? 50 : 0), 0);
  const status = determineStatus({ totalXp, history });
  db.update(schema.tricks).set({ totalXp, status }).where(eq(schema.tricks.id, trickId)).run();
}

export function deleteBodyLog(input: { profileId: string; bodyLogId: string }) {
  db.delete(schema.bodyLogs)
    .where(and(eq(schema.bodyLogs.id, input.bodyLogId), eq(schema.bodyLogs.profileId, input.profileId)))
    .run();
}

export function deleteRun(input: { profileId: string; runId: string }) {
  db.delete(schema.runs)
    .where(and(eq(schema.runs.id, input.runId), eq(schema.runs.profileId, input.profileId)))
    .run();
}

export function deleteJiu(input: { profileId: string; jiuId: string }) {
  db.delete(schema.jiuSessions)
    .where(and(eq(schema.jiuSessions.id, input.jiuId), eq(schema.jiuSessions.profileId, input.profileId)))
    .run();
}

export function updateBodyLog(input: {
  profileId: string;
  bodyLogId: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  visceralFat?: number | null;
  muscleMassKg?: number | null;
  waterPct?: number | null;
  energy?: number | null;
  mood?: number | null;
  sleepHours?: number | null;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  for (const k of [
    "weightKg",
    "bodyFatPct",
    "visceralFat",
    "muscleMassKg",
    "waterPct",
    "energy",
    "mood",
    "sleepHours",
    "notes",
  ] as const) {
    if (input[k] !== undefined) patch[k] = input[k];
  }
  if (Object.keys(patch).length === 0) return;
  db.update(schema.bodyLogs)
    .set(patch)
    .where(and(eq(schema.bodyLogs.id, input.bodyLogId), eq(schema.bodyLogs.profileId, input.profileId)))
    .run();
}

export function updateRun(input: {
  profileId: string;
  runId: string;
  date?: string;
  distanceKm?: number;
  durationMinutes?: number;
  type?: schema.Run["type"];
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.date !== undefined) patch.date = input.date;
  if (input.distanceKm !== undefined) patch.distanceKm = input.distanceKm;
  if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
  if (input.type !== undefined) patch.type = input.type;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.distanceKm !== undefined && input.durationMinutes !== undefined) {
    patch.pace = computePace(input.distanceKm, input.durationMinutes);
  }
  if (Object.keys(patch).length === 0) return;
  db.update(schema.runs)
    .set(patch)
    .where(and(eq(schema.runs.id, input.runId), eq(schema.runs.profileId, input.profileId)))
    .run();
}

export function updateJiu(input: {
  profileId: string;
  jiuId: string;
  date?: string;
  durationMinutes?: number;
  rolls?: number;
  intensity?: number;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.date !== undefined) patch.date = input.date;
  if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
  if (input.rolls !== undefined) patch.rolls = input.rolls;
  if (input.intensity !== undefined) patch.intensity = input.intensity;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.jiuSessions)
    .set(patch)
    .where(and(eq(schema.jiuSessions.id, input.jiuId), eq(schema.jiuSessions.profileId, input.profileId)))
    .run();
}

export function updateSkateSession(input: {
  profileId: string;
  sessionId: string;
  date?: string;
  durationMinutes?: number | null;
  location?: string | null;
  sessionType?: schema.SkateSession["sessionType"];
  feeling?: number | null;
  confidence?: number | null;
  pain?: number | null;
  flowState?: schema.SkateSession["flowState"];
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  for (const k of [
    "date",
    "durationMinutes",
    "location",
    "sessionType",
    "feeling",
    "confidence",
    "pain",
    "flowState",
    "notes",
  ] as const) {
    if (input[k] !== undefined) patch[k] = input[k];
  }
  if (Object.keys(patch).length === 0) return;
  db.update(schema.skateSessions)
    .set(patch)
    .where(and(eq(schema.skateSessions.id, input.sessionId), eq(schema.skateSessions.profileId, input.profileId)))
    .run();
}

function computePace(km: number, minutes: number) {
  if (!km || !minutes) return null;
  const paceMin = minutes / km;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}
