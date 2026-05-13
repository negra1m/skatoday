// Seed idempotente em JS puro (sem schema TS).
// Cria 1 profile + 15 tricks base se não houver profile ainda.

import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");
const dir = dirname(filePath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(filePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const existing = db.prepare("SELECT id, name FROM profiles LIMIT 1").get();
if (existing) {
  console.log("seed: profile já existe", existing.name);
  process.exit(0);
}

const profileId = randomUUID();
db.prepare(`
  INSERT INTO profiles (id, access_code_id, name, birth_year, height_cm, starting_weight_kg, goal)
  VALUES (?, NULL, ?, ?, ?, ?, ?)
`).run(profileId, "Vini", 1995, 181, 102, "Voltar ao eixo: skate, corpo leve, flow.");

const TRICKS = [
  ["Ollie", "flat", "regular", 1, "arsenal"],
  ["FS Ollie", "flat", "regular", 2, "aprendendo"],
  ["Shove-it", "flat", "regular", 2, "arsenal"],
  ["Fakie Shove-it", "fakie", "fakie", 2, "arsenal"],
  ["Halfcab", "fakie", "fakie", 2, "na_base"],
  ["Fakie Varial", "fakie", "fakie", 3, "na_base"],
  ["Halfcab Flip", "fakie", "fakie", 4, "quase"],
  ["Flip parado", "flat", "regular", 3, "aprendendo"],
  ["Manual", "manual", "regular", 2, "aprendendo"],
  ["No Comply", "freestyle", "regular", 2, "aprendendo"],
  ["Body Varial", "freestyle", "regular", 3, "descobrindo"],
  ["Drop", "transicao", "regular", 3, "pausada"],
  ["50-50 corrimão", "corrimao", "regular", 4, "pausada"],
  ["Boardslide redondo", "corrimao", "regular", 4, "pausada"],
  ["Slappy", "borda", "regular", 2, "aprendendo"],
];

const insertTrick = db.prepare(`
  INSERT INTO tricks (id, profile_id, name, category, stance, level, status, base_requirement, total_xp)
  VALUES (?, ?, ?, ?, ?, ?, ?, 10, 0)
`);
for (const [name, cat, stance, level, status] of TRICKS) {
  insertTrick.run(randomUUID(), profileId, name, cat, stance, level, status);
}

const today = new Date().toISOString().slice(0, 10);
db.prepare(`
  INSERT INTO body_logs (id, profile_id, date, weight_kg, body_fat_pct, energy, mood, sleep_hours, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(randomUUID(), profileId, today, 102, 29, 6, 7, 7, "primeiro log — dia que começou skatoday");

console.log("seed ok: profile=Vini, tricks=" + TRICKS.length);
db.close();
