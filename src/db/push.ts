import { and, eq } from "drizzle-orm";
import { db, schema } from "./client";

export function getSubscriptionsForUser(userId: string) {
  return db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId))
    .all();
}

export function upsertSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  const existing = db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, input.endpoint))
    .get();
  if (existing) {
    db.update(schema.pushSubscriptions)
      .set({
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? existing.userAgent,
        lastUsedAt: new Date().toISOString(),
      })
      .where(eq(schema.pushSubscriptions.id, existing.id))
      .run();
    return existing.id;
  }
  const row = db
    .insert(schema.pushSubscriptions)
    .values({
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    })
    .returning()
    .get();
  return row.id;
}

export function deleteSubscriptionByEndpoint(endpoint: string) {
  db.delete(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint))
    .run();
}

export function deleteSubscriptionById(id: string) {
  db.delete(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.id, id))
    .run();
}

export function listAllSubscriptions() {
  return db.select().from(schema.pushSubscriptions).all();
}
