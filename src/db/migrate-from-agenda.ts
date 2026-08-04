// Migra tasks.json (Agenda Few legado) → tasks no SQLite do skatoday.
//
// Uso:
//   1. Baixa /home/fewcompany/apps/few-server/apps/agenda/data/tasks.json da VPS
//   2. Coloca em data/import/tasks.json
//   3. npx tsx src/db/migrate-from-agenda.ts [--commit]
//
// Sem --commit: dry-run. Gera relatório em data/import/migration-report.json
// e mostra quais tasks são duplicadas (semantically) pra você revisar.
//
// Com --commit: insere no banco. Em duplicados, mantém o mais antigo (createdAt menor)
// ou o que tiver completedAt (concluído ganha sobre aberto).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { db, schema } from "./client";
import { eq } from "drizzle-orm";

type LegacyTask = {
  id?: string;
  title: string;
  project?: string;
  priority?: "urgent" | "next" | "stable" | "planned";
  done?: boolean;
  deadline?: string | null;
  notes?: string;
  createdAt?: string;
  completedAt?: string | null;
};

const IMPORT_PATH = "data/import/tasks.json";
const REPORT_PATH = "data/import/migration-report.json";
const COMMIT = process.argv.includes("--commit");

// Palavras "imperativas" comuns em TODOs — removem a diferença sintática
// entre "APAGAR X" e "REMOVER X" sem juntar contextos diferentes.
const ACTION_SYNONYMS: Record<string, string> = {
  apagar: "remover",
  deletar: "remover",
  excluir: "remover",
  remover: "remover",
  tirar: "remover",
  fix: "corrigir",
  arrumar: "corrigir",
  consertar: "corrigir",
  resolver: "corrigir",
  corrigir: "corrigir",
  adicionar: "criar",
  add: "criar",
  criar: "criar",
  fazer: "criar",
  implementar: "criar",
  build: "criar",
  testar: "testar",
  test: "testar",
  validar: "testar",
  verificar: "testar",
  documentar: "doc",
  doc: "doc",
  docs: "doc",
  atualizar: "atualizar",
  update: "atualizar",
};

const STOPWORDS = new Set([
  "a","o","as","os","de","do","da","dos","das","em","na","no","nas","nos",
  "para","pra","por","com","sem","e","ou","um","uma","uns","umas","ao","aos",
  "à","às","que","se","já","ainda","tem","ter","ser","é","na","no",
]);

function normalize(title: string) {
  return title
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

function similarity(a: string, b: string) {
  if (a === b) return 1;
  const sa = new Set(a.split(" "));
  const sb = new Set(b.split(" "));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  if (union === 0) return 0;
  return inter / union;
}

function pickKeeper(group: LegacyTask[]): LegacyTask {
  const done = group.filter((t) => t.done);
  if (done.length > 0) {
    return done.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
  }
  return group.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
}

async function run() {
  if (!existsSync(IMPORT_PATH)) {
    console.error(`arquivo não encontrado: ${IMPORT_PATH}`);
    console.error("baixe tasks.json da VPS e coloque em data/import/");
    process.exit(1);
  }

  const profile = db.select().from(schema.profiles).get();
  if (!profile) {
    console.error("profile não encontrado. rode npm run db:seed primeiro.");
    process.exit(1);
  }

  const raw: LegacyTask[] = JSON.parse(readFileSync(IMPORT_PATH, "utf-8"));
  console.log(`origem: ${raw.length} tasks`);

  // Agrupa por (projeto, normalized_title) — base do dedup
  const buckets = new Map<string, LegacyTask[]>();
  for (const t of raw) {
    const proj = t.project ?? "Outro";
    const key = `${proj}::${normalize(t.title)}`;
    const arr = buckets.get(key) ?? [];
    arr.push(t);
    buckets.set(key, arr);
  }

  const exactDups: Array<{ keeper: LegacyTask; dropped: LegacyTask[] }> = [];
  const toImport: LegacyTask[] = [];

  for (const [, group] of buckets) {
    if (group.length === 1) {
      toImport.push(group[0]);
    } else {
      const keeper = pickKeeper(group);
      toImport.push(keeper);
      exactDups.push({ keeper, dropped: group.filter((t) => t !== keeper) });
    }
  }

  // Detecta similaridade alta (>0.65) entre tasks de projetos diferentes
  // ou que o normalize não pegou. Marca como suspeito (não auto-merge).
  const suspectsRaw: Array<{ a: LegacyTask; b: LegacyTask; similarity: number }> = [];
  const importedNorm = toImport.map((t) => ({
    t,
    norm: normalize(t.title),
    proj: t.project ?? "",
  }));
  for (let i = 0; i < importedNorm.length; i++) {
    for (let j = i + 1; j < importedNorm.length; j++) {
      const a = importedNorm[i];
      const b = importedNorm[j];
      if (a.norm === b.norm) continue;
      const s = similarity(a.norm, b.norm);
      if (s >= 0.65) {
        suspectsRaw.push({ a: a.t, b: b.t, similarity: s });
      }
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
  console.log(`semantic suspects (rev. manual): ${suspects.length}`);
  console.log(`pronto pra importar: ${toImport.length}`);
  console.log(`relatório: ${REPORT_PATH}`);

  if (!COMMIT) {
    console.log("\nDRY-RUN. Revise o relatório antes. Pra inserir: --commit");
    return;
  }

  // Insert
  let inserted = 0;
  let skipped = 0;
  for (const t of toImport) {
    // Idempotência: se já existe por id, pula. Se id novo, insere.
    if (t.id) {
      const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, t.id)).get();
      if (existing) {
        skipped++;
        continue;
      }
    }
    db.insert(schema.tasks)
      .values({
        id: t.id,
        profileId: profile.id,
        title: t.title,
        project: t.project ?? "Outro",
        priority: t.priority ?? "next",
        done: !!t.done,
        deadline: t.deadline ?? null,
        notes: t.notes ?? null,
        completedAt: t.completedAt ?? null,
        createdAt: t.createdAt ?? new Date().toISOString(),
      })
      .run();
    inserted++;
  }
  console.log(`\nimportado: ${inserted} | pulado (já existia): ${skipped}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
