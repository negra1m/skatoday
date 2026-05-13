// Lógica de hidratação — portada de few-glasses, adaptada pra SQLite + meta por peso.

const ML_PER_KG = 35;
const MIN_GOAL = 1500;
const MAX_GOAL = 5000;

export function computeGoalFromWeight(weightKg: number | null | undefined): number {
  if (!weightKg || weightKg < 30) return 2000;
  const calc = Math.round(weightKg * ML_PER_KG);
  return Math.max(MIN_GOAL, Math.min(MAX_GOAL, calc));
}

export function glassesForGoal(goalMl: number, glassSizeMl: number): number {
  return Math.max(1, Math.ceil(goalMl / glassSizeMl));
}

// Distribui copos uniformemente entre wakeStart e wakeEnd. Retorna HH:MM[].
export function buildSchedule(opts: {
  goalMl: number;
  glassSizeMl: number;
  wakeStart: string;
  wakeEnd: string;
}): string[] {
  const glasses = glassesForGoal(opts.goalMl, opts.glassSizeMl);
  const [sh, sm] = opts.wakeStart.split(":").map(Number);
  const [eh, em] = opts.wakeEnd.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) return [];

  const out: string[] = [];
  if (glasses === 1) {
    out.push(opts.wakeStart);
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

// Compara HH:MM com agora — retorna o próximo horário (string) ou null.
export function nextScheduledTime(schedule: string[], now: Date = new Date()): string | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const t of schedule) {
    const [h, m] = t.split(":").map(Number);
    if (h * 60 + m > cur) return t;
  }
  return null;
}

export function progressPct(mlDrunk: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(100, Math.round((mlDrunk / goalMl) * 100));
}
