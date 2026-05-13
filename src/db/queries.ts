import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "./client";

export function listTricks(profileId: string) {
  return db
    .select()
    .from(schema.tricks)
    .where(eq(schema.tricks.profileId, profileId))
    .orderBy(desc(schema.tricks.totalXp))
    .all();
}

export function getTrickById(profileId: string, trickId: string) {
  return db
    .select()
    .from(schema.tricks)
    .where(and(eq(schema.tricks.id, trickId), eq(schema.tricks.profileId, profileId)))
    .get();
}

export function listSessionsInMonth(profileId: string, yearMonth: string) {
  return db
    .select()
    .from(schema.skateSessions)
    .where(
      and(
        eq(schema.skateSessions.profileId, profileId),
        sql`substr(${schema.skateSessions.date}, 1, 7) = ${yearMonth}`,
      ),
    )
    .all();
}

export function getSessionByDate(profileId: string, date: string) {
  return db
    .select()
    .from(schema.skateSessions)
    .where(and(eq(schema.skateSessions.profileId, profileId), eq(schema.skateSessions.date, date)))
    .get();
}

export function listSessionTricks(sessionId: string) {
  return db
    .select({
      st: schema.sessionTricks,
      trick: schema.tricks,
    })
    .from(schema.sessionTricks)
    .innerJoin(schema.tricks, eq(schema.tricks.id, schema.sessionTricks.trickId))
    .where(eq(schema.sessionTricks.sessionId, sessionId))
    .all();
}

export function listSessionTricksByTrick(trickId: string) {
  return db
    .select({
      st: schema.sessionTricks,
      session: schema.skateSessions,
    })
    .from(schema.sessionTricks)
    .innerJoin(schema.skateSessions, eq(schema.skateSessions.id, schema.sessionTricks.sessionId))
    .where(eq(schema.sessionTricks.trickId, trickId))
    .orderBy(desc(schema.skateSessions.date))
    .all();
}

export function listBodyLogs(profileId: string, sinceDate?: string) {
  const filter = sinceDate
    ? and(eq(schema.bodyLogs.profileId, profileId), gte(schema.bodyLogs.date, sinceDate))
    : eq(schema.bodyLogs.profileId, profileId);
  return db.select().from(schema.bodyLogs).where(filter).orderBy(desc(schema.bodyLogs.date)).all();
}

export function latestBodyLog(profileId: string) {
  return db
    .select()
    .from(schema.bodyLogs)
    .where(eq(schema.bodyLogs.profileId, profileId))
    .orderBy(desc(schema.bodyLogs.date))
    .get();
}

export function listRuns(profileId: string) {
  return db
    .select()
    .from(schema.runs)
    .where(eq(schema.runs.profileId, profileId))
    .orderBy(desc(schema.runs.date))
    .all();
}

export function listJiu(profileId: string) {
  return db
    .select()
    .from(schema.jiuSessions)
    .where(eq(schema.jiuSessions.profileId, profileId))
    .orderBy(desc(schema.jiuSessions.date))
    .all();
}

export function listRoutineForDate(profileId: string, date: string) {
  return db
    .select()
    .from(schema.routineChecks)
    .where(and(eq(schema.routineChecks.profileId, profileId), eq(schema.routineChecks.date, date)))
    .all();
}

export type TaskFilters = {
  project?: string | null;
  priority?: "urgent" | "next" | "stable" | "planned" | null;
  search?: string | null;
  showDone?: boolean;
};

export function listTasks(profileId: string, filters: TaskFilters = {}) {
  let rows = db.select().from(schema.tasks).where(eq(schema.tasks.profileId, profileId)).all();
  if (filters.project) rows = rows.filter((r) => r.project === filters.project);
  if (filters.priority) rows = rows.filter((r) => r.priority === filters.priority);
  if (!filters.showDone) rows = rows.filter((r) => !r.done);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.project.toLowerCase().includes(q) ||
        (r.notes ?? "").toLowerCase().includes(q),
    );
  }
  const order: Record<string, number> = { urgent: 0, next: 1, stable: 2, planned: 3 };
  rows.sort((a, b) => {
    const p = order[a.priority] - order[b.priority];
    if (p !== 0) return p;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return rows;
}

export function getTaskById(profileId: string, taskId: string) {
  return db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.profileId, profileId)))
    .get();
}

export function taskStats(profileId: string) {
  const all = db.select().from(schema.tasks).where(eq(schema.tasks.profileId, profileId)).all();
  const today = new Date().toISOString().slice(0, 10);
  const open = all.filter((t) => !t.done);
  return {
    total: all.length,
    done: all.length - open.length,
    open: open.length,
    urgent: open.filter((t) => t.priority === "urgent").length,
    overdue: open.filter((t) => t.deadline && t.deadline < today).length,
    dueToday: open.filter((t) => t.deadline === today).length,
  };
}

export function tasksByProject(profileId: string) {
  const all = db.select().from(schema.tasks).where(eq(schema.tasks.profileId, profileId)).all();
  const byProject = new Map<string, { open: number; done: number; nextDeadline: string | null }>();
  for (const t of all) {
    const cur = byProject.get(t.project) ?? { open: 0, done: 0, nextDeadline: null };
    if (t.done) cur.done++;
    else {
      cur.open++;
      if (t.deadline && (!cur.nextDeadline || t.deadline < cur.nextDeadline)) {
        cur.nextDeadline = t.deadline;
      }
    }
    byProject.set(t.project, cur);
  }
  return byProject;
}

export function urgentTasks(profileId: string, limit = 5) {
  const today = new Date().toISOString().slice(0, 10);
  const all = db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.profileId, profileId), eq(schema.tasks.done, false)))
    .all();
  return all
    .filter((t) => t.priority === "urgent" || (t.deadline && t.deadline <= today))
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    })
    .slice(0, limit);
}
