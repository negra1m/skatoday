// Migração de dados: liga profiles existentes ao primeiro user.
// Idempotente — só atualiza profiles que ainda não têm user_id.

import { db, schema } from "./client";
import { isNull, eq } from "drizzle-orm";

const user = db.select().from(schema.users).where(eq(schema.users.role, "admin")).get();
if (!user) {
  console.error("não há admin ainda. Crie primeiro: npm run user:create <user> <email> <senha>");
  process.exit(1);
}

const orphans = db.select().from(schema.profiles).where(isNull(schema.profiles.userId)).all();
console.log(`profiles órfãos: ${orphans.length}`);

for (const p of orphans) {
  db.update(schema.profiles).set({ userId: user.id }).where(eq(schema.profiles.id, p.id)).run();
}
console.log(`ok: vinculados ao admin ${user.username}`);
