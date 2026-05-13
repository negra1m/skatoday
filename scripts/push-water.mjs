// Cron tick: dispara push de hidratação aos usuários cujo schedule bate com a hora atual.
// Roda a cada minuto via cron. É idempotente: registra fired em water_logs (não tem) ...
// Estratégia: pra não disparar 2x no mesmo minuto se rodar mais que uma vez,
// gravamos em /tmp/skatoday-push-fired-YYYY-MM-DD.json. Recria todo dia.

import Database from "better-sqlite3";
import webpush from "web-push";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");
const db = new Database(filePath, { readonly: false });
db.pragma("journal_mode = WAL");

const PUB = process.env.VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;
const SUBJ = process.env.VAPID_SUBJECT ?? "mailto:admin@localhost";
if (!PUB || !PRIV) {
  console.error("VAPID keys ausentes");
  process.exit(1);
}
webpush.setVapidDetails(SUBJ, PUB, PRIV);

const ML_PER_KG = 35;
const MIN_GOAL = 1500;
const MAX_GOAL = 5000;

function computeGoalFromWeight(weightKg) {
  if (!weightKg || weightKg < 30) return 2000;
  const calc = Math.round(weightKg * ML_PER_KG);
  return Math.max(MIN_GOAL, Math.min(MAX_GOAL, calc));
}

function buildSchedule({ goalMl, glassSizeMl, wakeStart, wakeEnd }) {
  const glasses = Math.max(1, Math.ceil(goalMl / glassSizeMl));
  const [sh, sm] = wakeStart.split(":").map(Number);
  const [eh, em] = wakeEnd.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) return [];
  const out = [];
  if (glasses === 1) {
    out.push(wakeStart);
  } else {
    const step = (endMin - startMin) / (glasses - 1);
    for (let i = 0; i < glasses; i++) {
      const m = Math.round(startMin + step * i);
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
  }
  return out;
}

const now = new Date();
const today = now.toISOString().slice(0, 10);
const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const FIRED_PATH = `/tmp/skatoday-push-fired-${today}.json`;
const fired = existsSync(FIRED_PATH) ? JSON.parse(readFileSync(FIRED_PATH, "utf-8")) : {};

// Pega todos os usuários ativos com notifications_enabled
const configs = db
  .prepare(
    `SELECT p.id as profile_id, p.user_id, p.name as profile_name, p.starting_weight_kg,
            wc.goal_ml, wc.glass_size_ml, wc.wake_start, wc.wake_end, wc.notifications_enabled
     FROM water_configs wc
     JOIN profiles p ON p.id = wc.profile_id
     JOIN users u ON u.id = p.user_id
     WHERE wc.notifications_enabled = 1 AND u.active = 1`,
  )
  .all();

let totalSent = 0;
let totalSkipped = 0;

for (const cfg of configs) {
  // Peso mais recente
  const body = db
    .prepare("SELECT weight_kg FROM body_logs WHERE profile_id = ? ORDER BY date DESC LIMIT 1")
    .get(cfg.profile_id);
  const goalMl =
    cfg.goal_ml ??
    computeGoalFromWeight(body?.weight_kg ?? cfg.starting_weight_kg);
  const schedule = buildSchedule({
    goalMl,
    glassSizeMl: cfg.glass_size_ml,
    wakeStart: cfg.wake_start,
    wakeEnd: cfg.wake_end,
  });

  if (!schedule.includes(cur)) continue;

  const firedKey = `${cfg.user_id}:${cur}`;
  if (fired[firedKey]) {
    totalSkipped++;
    continue;
  }

  // Já bebeu a meta? Pula notificação
  const log = db
    .prepare("SELECT ml_drunk FROM water_logs WHERE profile_id = ? AND date = ?")
    .get(cfg.profile_id, today);
  if (log && log.ml_drunk >= goalMl) {
    fired[firedKey] = true;
    totalSkipped++;
    continue;
  }

  const subs = db
    .prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?")
    .all(cfg.user_id);
  if (subs.length === 0) continue;

  const payload = JSON.stringify({
    title: "💧 Hora de beber água",
    body: `${cfg.glass_size_ml}ml — Meta diária: ${(goalMl / 1000).toFixed(1)}L`,
    url: "/agua",
    tag: `skatoday-water-${cur}`,
  });

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 3600, urgency: "normal" },
      );
      totalSent++;
    } catch (err) {
      const code = err.statusCode;
      if (code === 404 || code === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(s.id);
        console.log(`[push] subscription gone, removed: ${s.id}`);
      } else {
        console.warn(`[push] failed: ${err.message}`);
      }
    }
  }
  fired[firedKey] = true;
}

writeFileSync(FIRED_PATH, JSON.stringify(fired), "utf-8");

if (totalSent > 0 || totalSkipped > 0) {
  console.log(`[${cur}] sent=${totalSent} skipped=${totalSkipped}`);
}
db.close();
