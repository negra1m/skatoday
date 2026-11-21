import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./client";
import { clampPhase } from "@/lib/plan";

// ── Fase de performance (no perfil) ───────────────────────────────────────────

export function getPerformancePhase(profileId: string): number {
  const row = db
    .select({ phase: schema.profiles.performancePhase })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, profileId))
    .get();
  return row?.phase ?? 1;
}

export function setPerformancePhase(profileId: string, n: number) {
  db.update(schema.profiles)
    .set({ performancePhase: clampPhase(n) })
    .where(eq(schema.profiles.id, profileId))
    .run();
}

// ── Fotos de acompanhamento ───────────────────────────────────────────────────

export function addBodyPhoto(input: {
  profileId: string;
  date: string;
  filename: string;
  pose?: schema.BodyPhoto["pose"];
  caption?: string | null;
}) {
  return db
    .insert(schema.bodyPhotos)
    .values({
      profileId: input.profileId,
      date: input.date,
      filename: input.filename,
      pose: input.pose ?? null,
      caption: input.caption ?? null,
    })
    .returning()
    .get();
}

export function listBodyPhotos(profileId: string, limit = 60) {
  return db
    .select()
    .from(schema.bodyPhotos)
    .where(eq(schema.bodyPhotos.profileId, profileId))
    .orderBy(desc(schema.bodyPhotos.date), desc(schema.bodyPhotos.createdAt))
    .limit(limit)
    .all();
}

/** Remove e devolve o filename pra apagar do disco. Checa o dono. */
export function deleteBodyPhoto(profileId: string, id: string): string | null {
  const row = db
    .select()
    .from(schema.bodyPhotos)
    .where(and(eq(schema.bodyPhotos.id, id), eq(schema.bodyPhotos.profileId, profileId)))
    .get();
  if (!row) return null;
  db.delete(schema.bodyPhotos).where(eq(schema.bodyPhotos.id, id)).run();
  return row.filename;
}
