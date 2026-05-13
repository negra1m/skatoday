import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "./client";

export function listRoutineItems(userId: string, includeArchived = false) {
  const filter = includeArchived
    ? eq(schema.routineItems.userId, userId)
    : and(eq(schema.routineItems.userId, userId), isNull(schema.routineItems.archivedAt));
  return db
    .select()
    .from(schema.routineItems)
    .where(filter)
    .orderBy(asc(schema.routineItems.sortOrder), asc(schema.routineItems.createdAt))
    .all();
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function createRoutineItem(input: { userId: string; label: string }) {
  const base = slugify(input.label);
  if (!base) throw new Error("label inválido");
  // Garante key único pra esse user
  const existing = db
    .select({ key: schema.routineItems.key })
    .from(schema.routineItems)
    .where(eq(schema.routineItems.userId, input.userId))
    .all()
    .map((r) => r.key);
  let key = base;
  let n = 2;
  while (existing.includes(key)) {
    key = `${base}_${n++}`;
  }
  return db
    .insert(schema.routineItems)
    .values({ userId: input.userId, key, label: input.label.trim() })
    .returning()
    .get();
}

export function updateRoutineItem(input: {
  userId: string;
  itemId: string;
  label?: string;
  sortOrder?: number;
}) {
  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.routineItems)
    .set(patch)
    .where(and(eq(schema.routineItems.id, input.itemId), eq(schema.routineItems.userId, input.userId)))
    .run();
}

export function deleteRoutineItem(input: { userId: string; itemId: string }) {
  db.delete(schema.routineItems)
    .where(and(eq(schema.routineItems.id, input.itemId), eq(schema.routineItems.userId, input.userId)))
    .run();
}
