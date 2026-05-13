import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./client";
import { computeGoalFromWeight } from "@/lib/water";

export function getWaterConfig(profileId: string) {
  return db
    .select()
    .from(schema.waterConfigs)
    .where(eq(schema.waterConfigs.profileId, profileId))
    .get();
}

export function getEffectiveGoalMl(profileId: string): number {
  const cfg = getWaterConfig(profileId);
  if (cfg?.goalMl) return cfg.goalMl;
  const body = db
    .select()
    .from(schema.bodyLogs)
    .where(eq(schema.bodyLogs.profileId, profileId))
    .orderBy(desc(schema.bodyLogs.date))
    .get();
  return computeGoalFromWeight(body?.weightKg ?? null);
}

export function ensureWaterConfig(profileId: string) {
  const cfg = getWaterConfig(profileId);
  if (cfg) return cfg;
  return db
    .insert(schema.waterConfigs)
    .values({ profileId })
    .returning()
    .get();
}

export function updateWaterConfig(input: {
  profileId: string;
  goalMl?: number | null;
  glassSizeMl?: number;
  wakeStart?: string;
  wakeEnd?: string;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
}) {
  ensureWaterConfig(input.profileId);
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const k of ["goalMl", "glassSizeMl", "wakeStart", "wakeEnd", "notificationsEnabled", "soundEnabled"] as const) {
    if (input[k] !== undefined) patch[k] = input[k];
  }
  db.update(schema.waterConfigs)
    .set(patch)
    .where(eq(schema.waterConfigs.profileId, input.profileId))
    .run();
}

export function getWaterLogForDate(profileId: string, date: string) {
  return db
    .select()
    .from(schema.waterLogs)
    .where(and(eq(schema.waterLogs.profileId, profileId), eq(schema.waterLogs.date, date)))
    .get();
}

export function addGlass(profileId: string, glassSizeMl: number, goalMl: number): { glassesDrunk: number; mlDrunk: number } {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getWaterLogForDate(profileId, today);
  if (!existing) {
    const row = db
      .insert(schema.waterLogs)
      .values({
        profileId,
        date: today,
        glassesDrunk: 1,
        mlDrunk: glassSizeMl,
        goalMlSnapshot: goalMl,
      })
      .returning()
      .get();
    return { glassesDrunk: row.glassesDrunk, mlDrunk: row.mlDrunk };
  }
  const next = {
    glassesDrunk: existing.glassesDrunk + 1,
    mlDrunk: existing.mlDrunk + glassSizeMl,
    updatedAt: new Date().toISOString(),
  };
  db.update(schema.waterLogs)
    .set(next)
    .where(eq(schema.waterLogs.id, existing.id))
    .run();
  return { glassesDrunk: next.glassesDrunk, mlDrunk: next.mlDrunk };
}

export function removeGlass(profileId: string, glassSizeMl: number): { glassesDrunk: number; mlDrunk: number } {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getWaterLogForDate(profileId, today);
  if (!existing || existing.glassesDrunk <= 0) return { glassesDrunk: 0, mlDrunk: 0 };
  const next = {
    glassesDrunk: Math.max(0, existing.glassesDrunk - 1),
    mlDrunk: Math.max(0, existing.mlDrunk - glassSizeMl),
    updatedAt: new Date().toISOString(),
  };
  db.update(schema.waterLogs)
    .set(next)
    .where(eq(schema.waterLogs.id, existing.id))
    .run();
  return { glassesDrunk: next.glassesDrunk, mlDrunk: next.mlDrunk };
}

export function listWaterHistory(profileId: string, days = 30) {
  return db
    .select()
    .from(schema.waterLogs)
    .where(eq(schema.waterLogs.profileId, profileId))
    .orderBy(desc(schema.waterLogs.date))
    .limit(days)
    .all();
}
