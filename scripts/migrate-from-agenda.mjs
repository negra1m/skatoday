// Migra tasks.json (Agenda Few legado) → tasks no SQLite.
// Versão JS puro (sem schema TS).
//
// Uso:
//   1. Coloca tasks.json em /app/data/import/tasks.json
//   2. node scripts/migrate-from-agenda.mjs            (dry-run)
//   3. node scripts/migrate-from-agenda.mjs --commit   (insere)

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const IMPORT_PATH = "data/import/tasks.json";
const REPORT_PATH = "data/import/migration-report.json";
const COMMIT = process.argv.includes("--commit");

const ACTION_SYNONYMS = {
  apagar: "remover", deletar: "remover", excluir: "remover", remover: "remover", tirar: "remover",
  fix: "corrigir", arrumar: "corrigir", consertar: "corrigir", resolver: "corrigir", corrigir: "corrigir",
  adicionar: "criar", add: "criar", criar: "criar", fazer: "criar", implementar: "criar", build: "criar",
  testar: "testar", test: "testar", validar: "testar", verificar: "testar",
  documentar: "doc", doc: "doc", docs: "doc",
  atualizar: "atualizar", update: "atualizar",
};

const STOPWORDS = new Set([
  "a","o","as","os","de","do","da","dos","das","em","na","no","nas","nos",
  "para","pra","por","com","sem","e","ou","um","uma","uns","umas","ao","aos",
  "à","às","que","se","já","ainda","tem","ter","ser","é",
]);

function normalize(title) {
  return String(title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ACTION_SYNONYMS[w] ?? w)
    .filter((w) => !STOPWORDS.has(w))
    .sort()
    .join(" ");
}

function similarity(a, b) {
  if (a === b) return 1;
  const sa = new Set(a.split(" "));
  const sb = new Set(b.split(" "));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function pickKeeper(group) {
  const done = group.filter((t) => t.done);
  if (done.length > 0) {
    return done.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
  }
  return group.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
}

if (!existsSync(IMPORT_PATH)) {
  console.error(`arquivo não encontrado: ${IMPORT_PATH}`);
  console.error("coloque tasks.json em data/import/");
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");
const db = new Database(filePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const profile = db.prepare("SELECT id, name FROM profiles LIMIT 1").get();
if (!profile) {
  console.error("profile não encontrado. seed primeiro.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(IMPORT_PATH, "utf-8"));
console.log(`origem: ${raw.length} tasks`);

const buckets = new Map();
for (const t of raw) {
  const proj = t.project ?? "Outro";
  const key = `${proj}::${normalize(t.title)}`;
  const arr = buckets.get(key) ?? [];
  arr.push(t);
  buckets.set(key, arr);
}

const exactDups = [];
const toImport = [];
for (const [, group] of buckets) {
  if (group.length === 1) {
    toImport.push(group[0]);
  } else {
    const keeper = pickKeeper(group);
    toImport.push(keeper);
    exactDups.push({ keeper, dropped: group.filter((t) => t !== keeper) });
  }
}

const suspectsRaw = [];
const importedNorm = toImport.map((t) => ({ t, norm: normalize(t.title), proj: t.project ?? "" }));
for (let i = 0; i < importedNorm.length; i++) {
  for (let j = i + 1; j < importedNorm.length; j++) {
    const a = importedNorm[i];
    const b = importedNorm[j];
    if (a.norm === b.norm) continue;
    const s = similarity(a.norm, b.norm);
    if (s >= 0.65) suspectsRaw.push({ a: a.t, b: b.t, similarity: s });
  }
}
const suspects = suspectsRaw.sort((x, y) => y.similarity - x.similarity);

const report = {
  sourceTotal: raw.length,
  toImport: toImport.length,
  exactDupGroups: exactDups.length,
  exactDups: exactDups.map((g) => ({
    keeper: { title: g.keeper.title, project: g.keeper.project, done: g.keeper.done },
    dropped: g.dropped.map((d) => ({ title: d.title, project: d.project, done: d.done })),
  })),
  semanticSuspects: suspects.slice(0, 50).map((s) => ({
    similarity: Number(s.similarity.toFixed(2)),
    a: { title: s.a.title, project: s.a.project, done: s.a.done },
    b: { title: s.b.title, project: s.b.project, done: s.b.done },
  })),
};

mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

console.log("---");
console.log(`exact-dup groups: ${exactDups.length} (descarta ${raw.length - toImport.length} tasks)`);
console.log(`semantic suspects (revisão manual): ${suspects.length}`);
console.log(`pronto pra importar: ${toImport.length}`);
console.log(`relatório: ${REPORT_PATH}`);

if (!COMMIT) {
  console.log("\nDRY-RUN. Revise o relatório antes. Pra inserir: --commit");
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO tasks (id, profile_id, title, project, priority, done, deadline, notes, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const existsStmt = db.prepare("SELECT 1 FROM tasks WHERE id = ?");
let inserted = 0, skipped = 0;
for (const t of toImport) {
  const id = t.id ?? randomUUID();
  if (existsStmt.get(id)) { skipped++; continue; }
  insert.run(
    id,
    profile.id,
    t.title,
    t.project ?? "Outro",
    t.priority ?? "next",
    t.done ? 1 : 0,
    t.deadline ?? null,
    t.notes ?? null,
    t.createdAt ?? new Date().toISOString(),
    t.completedAt ?? null,
  );
  inserted++;
}
console.log(`\nimportado: ${inserted} | pulado (já existia): ${skipped}`);
db.close();
