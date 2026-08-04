// Popula projetos e itens de rotina pro usuário admin existente.
// Idempotente: pula se já tiver projetos/rotina cadastrados.
//
// Uso:
//   docker compose exec skatoday node scripts/seed-admin-defaults.mjs [username]
//   (sem args: pega o primeiro admin)

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");
const db = new Database(filePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const username = process.argv[2];
const user = username
  ? db.prepare("SELECT id, username FROM users WHERE username = ?").get(username.toLowerCase())
  : db.prepare("SELECT id, username FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1").get();

if (!user) {
  console.error("admin não encontrado");
  process.exit(1);
}

console.log(`seed defaults para: ${user.username}`);

const existingProjects = db.prepare("SELECT COUNT(*) as n FROM projects WHERE user_id = ?").get(user.id).n;
if (existingProjects === 0) {
  const fewProjects = [
    "iFIGHT",
    "Archradar",
    "AppResente",
    "Sentinel",
    "skatoday",
    "Sentinel PWA",
    "Sentinel Agent",
    "oAuth Few",
    "Email Manager",
    "Paulinho Poker",
    "LibreIC",
    "Pede Aqui!",
    "OndeTá",
    "ICAE",
    "INIEC",
  ];
  const ins = db.prepare(
    "INSERT INTO projects (id, user_id, name, sort_order) VALUES (?, ?, ?, ?)",
  );
  fewProjects.forEach((name, i) => ins.run(randomUUID(), user.id, name, i));
  console.log(`  ${fewProjects.length} projetos criados`);
} else {
  console.log(`  ${existingProjects} projetos já existem, pulando`);
}

const existingRoutine = db.prepare("SELECT COUNT(*) as n FROM routine_items WHERE user_id = ?").get(user.id).n;
if (existingRoutine === 0) {
  const items = [
    ["dogs", "Dogs"],
    ["louca", "Louça"],
    ["varrer", "Varrer"],
    ["skate", "Skate"],
    ["corrida", "Corrida"],
    ["banho", "Banho"],
    ["comida", "Comida"],
    ["few", "Few/iFIGHT"],
  ];
  const ins = db.prepare(
    "INSERT INTO routine_items (id, user_id, key, label, sort_order) VALUES (?, ?, ?, ?, ?)",
  );
  items.forEach(([key, label], i) => ins.run(randomUUID(), user.id, key, label, i));
  console.log(`  ${items.length} itens de rotina criados`);
} else {
  console.log(`  ${existingRoutine} itens de rotina já existem, pulando`);
}

console.log("ok");
db.close();
