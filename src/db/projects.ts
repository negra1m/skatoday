import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "./client";
import type { NewProject } from "./schema";

// ---- N:N client_projects ----

export function listClientsOfProject(projectId: string) {
  return db
    .select({
      id: schema.clients.id,
      name: schema.clients.name,
      company: schema.clients.company,
      status: schema.clients.status,
    })
    .from(schema.clientProjects)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.clientProjects.clientId))
    .where(eq(schema.clientProjects.projectId, projectId))
    .orderBy(asc(schema.clients.name))
    .all();
}

export function listProjectsOfClient(clientId: string) {
  return db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      color: schema.projects.color,
      archivedAt: schema.projects.archivedAt,
    })
    .from(schema.clientProjects)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.clientProjects.projectId))
    .where(eq(schema.clientProjects.clientId, clientId))
    .orderBy(asc(schema.projects.name))
    .all();
}

export function linkClientProject(clientId: string, projectId: string) {
  try {
    db.insert(schema.clientProjects).values({ clientId, projectId }).run();
  } catch {
    // já vinculado — ignora
  }
}

export function unlinkClientProject(clientId: string, projectId: string) {
  db.delete(schema.clientProjects)
    .where(
      and(
        eq(schema.clientProjects.clientId, clientId),
        eq(schema.clientProjects.projectId, projectId),
      ),
    )
    .run();
}

export function listProjects(userId: string, includeArchived = false) {
  const filter = includeArchived
    ? eq(schema.projects.userId, userId)
    : and(eq(schema.projects.userId, userId), isNull(schema.projects.archivedAt));
  return db
    .select()
    .from(schema.projects)
    .where(filter)
    .orderBy(asc(schema.projects.sortOrder), asc(schema.projects.name))
    .all();
}

export function listActiveProjectNames(userId: string): string[] {
  return listProjects(userId, false).map((p) => p.name);
}

export function createProject(input: {
  userId: string;
  name: string;
  color?: string | null;
}) {
  return db
    .insert(schema.projects)
    .values({
      userId: input.userId,
      name: input.name.trim(),
      color: input.color ?? null,
    })
    .returning()
    .get();
}

export function updateProject(input: {
  userId: string;
  projectId: string;
  name?: string;
  color?: string | null;
  sortOrder?: number;
}) {
  const patch: Partial<NewProject> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.color !== undefined) patch.color = input.color;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.projects)
    .set(patch)
    .where(and(eq(schema.projects.id, input.projectId), eq(schema.projects.userId, input.userId)))
    .run();
}

export function archiveProject(input: { userId: string; projectId: string }) {
  db.update(schema.projects)
    .set({ archivedAt: new Date().toISOString() })
    .where(and(eq(schema.projects.id, input.projectId), eq(schema.projects.userId, input.userId)))
    .run();
}

export function unarchiveProject(input: { userId: string; projectId: string }) {
  db.update(schema.projects)
    .set({ archivedAt: null })
    .where(and(eq(schema.projects.id, input.projectId), eq(schema.projects.userId, input.userId)))
    .run();
}

export function deleteProject(input: { userId: string; projectId: string }) {
  db.delete(schema.projects)
    .where(and(eq(schema.projects.id, input.projectId), eq(schema.projects.userId, input.userId)))
    .run();
}

export function projectStats(userId: string, profileId: string) {
  const projs = listProjects(userId);
  const today = new Date().toISOString().slice(0, 10);
  const map = new Map<string, { open: number; done: number; nextDeadline: string | null }>();
  for (const p of projs) {
    map.set(p.name, { open: 0, done: 0, nextDeadline: null });
  }
  const tasks = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.profileId, profileId))
    .all();
  for (const t of tasks) {
    const cur = map.get(t.project);
    if (!cur) continue;
    if (t.done) cur.done++;
    else {
      cur.open++;
      if (t.deadline && (!cur.nextDeadline || t.deadline < cur.nextDeadline)) {
        cur.nextDeadline = t.deadline;
      }
    }
  }
  return { projects: projs, statsByName: map, today };
}

export function getProjectById(userId: string, projectId: string) {
  return db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)))
    .get();
}

export function ownsClient(userId: string, clientId: string): boolean {
  const c = db
    .select({ id: schema.clients.id })
    .from(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.userId, userId)))
    .get();
  return !!c;
}

export function ownsProject(userId: string, projectId: string): boolean {
  const p = db
    .select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)))
    .get();
  return !!p;
}
