// Plano de metas de peso + fase de atividade (caminhada → corrida).
// Montado com o Vini: secar do ponto de partida até o objetivo, caminhando
// até os 90kg e só então retomando a corrida — de forma gradual, por causa
// do joelho (dor patelar recorrente).

export type Milestone = {
  kg: number;
  label: string;
  optional?: boolean;
};

export const START_WEIGHT_KG = 97;
/** Ao atingir este peso, a corrida é retomada (de forma gradual). */
export const RUN_UNLOCK_KG = 90;
/** Objetivo principal — base da barra de progresso. */
export const MAIN_GOAL_KG = 80;

export const MILESTONES: Milestone[] = [
  { kg: 97, label: "Ponto de partida" },
  { kg: 90, label: "Primeira meta — retoma corrida" },
  { kg: 85, label: "Cintura mais estreita" },
  { kg: 80, label: "Objetivo principal" },
  { kg: 76, label: "Referência 2021", optional: true },
];

export type Phase = "caminhada" | "corrida";

export const PHASE_GUIDE: Record<Phase, { titulo: string; linhas: string[] }> = {
  caminhada: {
    titulo: "Fase: caminhada",
    linhas: [
      "1 km por dia em horário fresco, ritmo confortável, sem dor no joelho.",
      "Skate 2x/semana com aquecimento; evitar manobras que doam.",
      `Corrida retoma ao bater ${RUN_UNLOCK_KG}kg.`,
    ],
  },
  corrida: {
    titulo: "Fase: corrida liberada",
    linhas: [
      "Retorno gradual: reconstruir tolerância a impacto, não puxar volume.",
      "Ritmo de conversa, esquece relógio e pace no começo.",
      "Sem dor durante nem nas 24h seguintes — se doer, recua.",
      "Joelho sensível (patelar): considere avaliação com fisio esportivo.",
    ],
  },
};

export const PACE_NOTE = "Perda média de 0,5–1 kg por semana, sem forçar o ritmo.";

export type PlanStatus = {
  current: number | null;
  phase: Phase;
  runUnlocked: boolean;
  /** Próxima meta a atingir (peso menor que o atual), ou null se já passou de todas. */
  nextMilestone: Milestone | null;
  /** Kg perdidos desde o ponto de partida (>= 0). */
  lostKg: number;
  /** Kg que faltam pra próxima meta, ou null. */
  toNextKg: number | null;
  /** % do caminho do ponto de partida até o objetivo principal (0..100). */
  pctToMainGoal: number;
};

export function planStatus(current: number | null): PlanStatus {
  if (current == null) {
    return {
      current: null,
      phase: "caminhada",
      runUnlocked: false,
      nextMilestone: MILESTONES.find((m) => m.kg === RUN_UNLOCK_KG) ?? null,
      lostKg: 0,
      toNextKg: null,
      pctToMainGoal: 0,
    };
  }

  const runUnlocked = current <= RUN_UNLOCK_KG;
  // Próxima meta = maior kg que ainda está abaixo do peso atual.
  const below = MILESTONES.filter((m) => m.kg < current).sort((a, b) => b.kg - a.kg);
  const nextMilestone = below[0] ?? null;

  const lostKg = Math.max(0, START_WEIGHT_KG - current);
  const toNextKg = nextMilestone ? Math.max(0, +(current - nextMilestone.kg).toFixed(1)) : null;
  const span = START_WEIGHT_KG - MAIN_GOAL_KG;
  const pctToMainGoal = Math.max(0, Math.min(100, Math.round(((START_WEIGHT_KG - current) / span) * 100)));

  return {
    current,
    phase: runUnlocked ? "corrida" : "caminhada",
    runUnlocked,
    nextMilestone,
    lostKg: +lostKg.toFixed(1),
    toNextKg,
    pctToMainGoal,
  };
}

/** Uma meta é considerada atingida quando o peso atual chegou nela ou abaixo. */
export function milestoneReached(m: Milestone, current: number | null): boolean {
  return current != null && current <= m.kg;
}
