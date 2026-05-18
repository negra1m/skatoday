import type { SessionTrick, Trick } from "@/db/schema";

export type TrickStatus = Trick["status"];

export function calcXP(params: {
  attempts: number;
  lands: number;
  bestStreak: number;
  isFirstToday: boolean;
  daysAway: number;
}) {
  const { attempts, lands, bestStreak, isFirstToday, daysAway } = params;
  let xp = attempts * 1 + lands * 5;
  if (bestStreak >= 10) xp += 50;
  if (isFirstToday) xp += 10;
  if (daysAway >= 7) xp += 20;
  return xp;
}

export function determineStatus(params: {
  totalXp: number;
  history: Array<Pick<SessionTrick, "bestStreak" | "isBaseRun"> & { date: string }>;
}): TrickStatus {
  const { totalXp, history } = params;
  const baseRunDays = new Set(history.filter((h) => h.isBaseRun).map((h) => h.date));
  if (baseRunDays.size >= 3) return "arsenal";
  if (history.some((h) => h.isBaseRun || h.bestStreak >= 10)) return "na_base";
  if (totalXp >= 100) return "quase";
  if (totalXp >= 20) return "aprendendo";
  return "descobrindo";
}

export function dailyScore(params: {
  skated: boolean;
  bodyLogged: boolean;
  ran: boolean;
  jiu: boolean;
  routinePct: number;
  tasksDoneToday: number;
}) {
  const { skated, bodyLogged, ran, jiu, routinePct, tasksDoneToday } = params;
  let s = 0;
  // Pesos redistribuídos (skate 25, body 10, run 15, jiu 15, rotina 15, tasks 20 = 100)
  if (skated) s += 25;
  if (bodyLogged) s += 10;
  if (ran) s += 15;
  if (jiu) s += 15;
  s += Math.round(routinePct * 15);
  // Tasks: +5 por task feita hoje, máx 20 pontos (4 tasks zeram a categoria)
  s += Math.min(20, tasksDoneToday * 5);
  return Math.min(s, 100);
}

export function computeStreak(dates: string[]) {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (true) {
    const iso = cur.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}
