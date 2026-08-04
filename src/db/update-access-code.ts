// Troca um access code por outro.
//
// Uso (nunca hardcode os códigos — eles são credenciais):
//   OLD_ACCESS_CODE=<atual> NEW_ACCESS_CODE=<novo> npx tsx src/db/update-access-code.ts
//
// Valores em uso: <ver ACESSOS.md>

import { db, schema } from "./client";
import { eq } from "drizzle-orm";

const OLD = process.env.OLD_ACCESS_CODE;
const NEW = process.env.NEW_ACCESS_CODE;

if (!OLD || !NEW) {
  console.error("defina OLD_ACCESS_CODE e NEW_ACCESS_CODE no ambiente (ver ACESSOS.md)");
  process.exit(1);
}

const existing = db.select().from(schema.accessCodes).where(eq(schema.accessCodes.code, OLD)).get();
if (!existing) {
  console.log("código antigo não encontrado, nada a fazer");
  process.exit(0);
}

db.update(schema.accessCodes).set({ code: NEW }).where(eq(schema.accessCodes.id, existing.id)).run();
console.log(`código atualizado: ${OLD} → ${NEW}`);
