// Plano de Evolução Física 2026/2027 (montado com o Vini).
// Secar do ponto de partida ao objetivo, com retorno à corrida GRADUAL —
// condicionado à recuperação funcional do joelho (dor patelar), NÃO ao peso.
// Por isso a fase de performance avança manualmente, não por kg.

export type Milestone = {
  kg: number;
  label: string;
  /** Janela estimada (cenário, não prazo garantido). */
  window: string;
};

export const START_WEIGHT_KG = 97;
/** Objetivo principal — base da barra de progresso. É meta de avaliação. */
export const MAIN_GOAL_KG = 80;
/** Referência histórica (2021), não é meta da escada. */
export const REF_2021_KG = 76;

export const MILESTONES: Milestone[] = [
  { kg: 97, label: "Ponto de partida", window: "nov/26" },
  { kg: 90, label: "Primeiro marco", window: "jan–mar/27" },
  { kg: 85, label: "Segundo marco", window: "fev–mai/27" },
  { kg: 80, label: "Meta principal", window: "mar–jul/27" },
];

export const PACE_NOTE = "Perda média de 0,5–1 kg por semana, sem forçar. Datas são cenários, não prazos.";
export const GOAL_NOTE =
  "80kg é meta de avaliação: se estiver definido e forte aos ~82, não perde músculo pra bater o número.";

// ── Cintura ───────────────────────────────────────────────────────────────────
export const HEIGHT_CM = 178;
export const WAIST_START_CM = 103;
export const WAIST_FIRST_MARK_CM = 98;
/** Relação cintura/altura < 0,5 → referência de saúde. */
export const WAIST_HEALTHY_CM = Math.floor(HEIGHT_CM * 0.5); // 89

// ── Fases de performance ──────────────────────────────────────────────────────
export type PerformancePhase = {
  n: number;
  titulo: string;
  linhas: string[];
};

export const PERFORMANCE_PHASES: PerformancePhase[] = [
  {
    n: 1,
    titulo: "Condicionamento básico",
    linhas: [
      "Caminhar sem dor, manter o skate e fortalecer pernas (quadríceps, posteriores, glúteos, panturrilha).",
      "Caminhada 1km/dia nos dias tolerados, horário fresco. Dia de skate não precisa somar caminhada.",
    ],
  },
  {
    n: 2,
    titulo: "Retorno à corrida",
    linhas: [
      "Só após avaliação e boa tolerância a carga — não é gatilho de peso, é o joelho.",
      "Alternar caminhada e corrida, progredindo até 5km confortáveis.",
      "Ritmo de conversa, sem relógio/pace. Sem dor durante nem nas 24h seguintes.",
      "Joelho patelar: avaliação com fisio esportivo antes de regularizar.",
    ],
  },
  {
    n: 3,
    titulo: "Resistência avançada",
    linhas: [
      "5 → 10km → meia maratona → futuramente 42,2km, de forma gradual.",
      "Skate: potência, controle nas aterrissagens, equilíbrio e resistência.",
    ],
  },
];

export const MAX_PHASE = PERFORMANCE_PHASES.length;

export function performancePhaseInfo(n: number): PerformancePhase {
  return PERFORMANCE_PHASES.find((p) => p.n === n) ?? PERFORMANCE_PHASES[0];
}

export function clampPhase(n: number): number {
  return Math.max(1, Math.min(MAX_PHASE, Math.round(n)));
}

/** Rótulo curto da fase, pro chip do HUD. */
export function phaseShortLabel(n: number): string {
  return n >= 3 ? "Resistência" : n === 2 ? "Corrida" : "Caminhada";
}

// ── Status de peso ────────────────────────────────────────────────────────────
export type PlanStatus = {
  current: number | null;
  nextMilestone: Milestone | null;
  lostKg: number;
  toNextKg: number | null;
  pctToMainGoal: number;
};

export function planStatus(current: number | null): PlanStatus {
  if (current == null) {
    return {
      current: null,
      nextMilestone: MILESTONES.find((m) => m.kg < START_WEIGHT_KG) ?? null,
      lostKg: 0,
      toNextKg: null,
      pctToMainGoal: 0,
    };
  }
  const below = MILESTONES.filter((m) => m.kg < current).sort((a, b) => b.kg - a.kg);
  const nextMilestone = below[0] ?? null;
  const lostKg = Math.max(0, +(START_WEIGHT_KG - current).toFixed(1));
  const toNextKg = nextMilestone ? Math.max(0, +(current - nextMilestone.kg).toFixed(1)) : null;
  const span = START_WEIGHT_KG - MAIN_GOAL_KG;
  const pctToMainGoal = Math.max(0, Math.min(100, Math.round(((START_WEIGHT_KG - current) / span) * 100)));
  return { current, nextMilestone, lostKg, toNextKg, pctToMainGoal };
}

export function milestoneReached(m: Milestone, current: number | null): boolean {
  return current != null && current <= m.kg;
}

// ── Status de cintura ─────────────────────────────────────────────────────────
export type WaistStatus = {
  current: number | null;
  nextTargetCm: number | null;
  lostCm: number;
  pctToHealthy: number;
};

export function waistStatus(current: number | null): WaistStatus {
  if (current == null) {
    return { current: null, nextTargetCm: WAIST_FIRST_MARK_CM, lostCm: 0, pctToHealthy: 0 };
  }
  const nextTargetCm =
    current > WAIST_FIRST_MARK_CM ? WAIST_FIRST_MARK_CM : current > WAIST_HEALTHY_CM ? WAIST_HEALTHY_CM : null;
  const lostCm = Math.max(0, +(WAIST_START_CM - current).toFixed(1));
  const span = WAIST_START_CM - WAIST_HEALTHY_CM;
  const pctToHealthy = Math.max(0, Math.min(100, Math.round(((WAIST_START_CM - current) / span) * 100)));
  return { current, nextTargetCm, lostCm, pctToHealthy };
}
