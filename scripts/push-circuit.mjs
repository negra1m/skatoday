// Cron tick: dispara push do circuito diário aos usuários cujo horário bate com
// a hora atual e que ainda não fizeram o treino hoje. Roda a cada minuto.
// Dedup por /tmp/skatoday-circuit-fired-YYYY-MM-DD.json (recria todo dia).

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

function buildSchedule(windowStart, windowEnd, count) {
  const n = Math.max(1, Math.floor(count));
  const [sh, sm] = windowStart.split(":").map(Number);
  const [eh, em] = windowEnd.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return [];
  if (n === 1) return [windowStart];
  const out = [];
  const step = (endMin - startMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const m = Math.round(startMin + step * i);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

const now = new Date();
const today = now.toISOString().slice(0, 10);
const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const FIRED_PATH = `/tmp/skatoday-circuit-fired-${today}.json`;
const fired = existsSync(FIRED_PATH) ? JSON.parse(readFileSync(FIRED_PATH, "utf-8")) : {};

const configs = db
  .prepare(
    `SELECT p.id as profile_id, p.user_id,
            c.window_start, c.window_end, c.reminders_per_day
     FROM workout_circuit_configs c
     JOIN profiles p ON p.id = c.profile_id
     JOIN users u ON u.id = p.user_id
     WHERE c.notifications_enabled = 1 AND u.active = 1`,
  )
  .all();

let totalSent = 0;
let totalSkipped = 0;

for (const cfg of configs) {
  const schedule = buildSchedule(cfg.window_start, cfg.window_end, cfg.reminders_per_day);
  if (!schedule.includes(cur)) continue;

  const firedKey = `${cfg.user_id}:${cur}`;
  if (fired[firedKey]) {
    totalSkipped++;
    continue;
  }

  // Já fez o treino hoje? Não cutuca.
  const log = db
    .prepare("SELECT done FROM workout_circuit_logs WHERE profile_id = ? AND date = ?")
    .get(cfg.profile_id, today);
  if (log && log.done) {
    fired[firedKey] = true;
    totalSkipped++;
    continue;
  }

  const subs = db
    .prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?")
    .all(cfg.user_id);
  if (subs.length === 0) continue;

  const payload = JSON.stringify({
    title: "🏋️ Hora do treino",
    body: "Circuito de 20 min — manda ver e mantém o ritmo.",
    url: "/academia",
    tag: `skatoday-circuit-${cur}`,
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 3600, urgency: "normal" },
      );
      totalSent++;
    } catch (err) {
      const code = err.statusCode;
      if (code === 404 || code === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
        console.log(`[push-circuit] subscription gone, removed: ${sub.id}`);
      } else {
        console.warn(`[push-circuit] failed: ${err.message}`);
      }
    }
  }
  fired[firedKey] = true;
}

writeFileSync(FIRED_PATH, JSON.stringify(fired), "utf-8");

if (totalSent > 0 || totalSkipped > 0) {
  console.log(`[circuit ${cur}] sent=${totalSent} skipped=${totalSkipped}`);
}
db.close();
