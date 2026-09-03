// Regras de progressão de carga da academia.
// Nada aqui toca banco nem React — é a regra de negócio pura.

export type MuscleGroup =
  | "peito"
  | "costas"
  | "ombro"
  | "biceps"
  | "triceps"
  | "perna"
  | "posterior"
  | "panturrilha"
  | "abdomen"
  | "outro";

export type ProgressionStatus = "sem_dados" | "manter" | "progredindo" | "subir";

export type LoggedSet = { setNumber: number; weightKg: number | null; reps: number | null };

/**
 * Quanto somar na carga quando a faixa fecha. Composto de perna aguenta
 * salto maior; isolado de braço/ombro precisa de incremento fino, senão
 * a faixa de reps despenca e a progressão trava.
 */
export function loadIncrement(group: MuscleGroup): number {
  if (group === "perna" || group === "posterior") return 5;
  if (group === "costas" || group === "peito") return 2.5;
  return 2.5;
}

/**
 * Regra central: a carga só sobe quando TODAS as séries previstas
 * atingem o topo da faixa na mesma carga.
 *
 *   Semana 1: 70kg 10/9/8   → manter
 *   Semana 2: 70kg 10/10/9  → progredindo
 *   Semana 3: 70kg 10/10/10 → subir
 *
 * Séries incompletas ou sem carga registrada não contam como fechadas.
 */
export function progressionStatus(input: {
  sets: number;
  repMax: number;
  lastSession: LoggedSet[];
  previousSession?: LoggedSet[];
}): ProgressionStatus {
  const done = input.lastSession.filter((s) => s.reps != null && s.reps > 0);
  if (done.length === 0) return "sem_dados";

  const weights = new Set(done.map((s) => s.weightKg ?? 0));
  const closedAll =
    done.length >= input.sets &&
    done.every((s) => (s.reps as number) >= input.repMax) &&
    weights.size === 1;
  if (closedAll) return "subir";

  if (input.previousSession?.length) {
    const now = totalReps(input.lastSession);
    const before = totalReps(input.previousSession);
    // Só conta como progresso se a carga não caiu pra inflar as reps.
    if (now > before && maxWeight(input.lastSession) >= maxWeight(input.previousSession)) {
      return "progredindo";
    }
  }

  return "manter";
}

/** Próxima carga sugerida, ou null se ainda não é hora de subir. */
export function suggestedNextWeight(input: {
  status: ProgressionStatus;
  group: MuscleGroup;
  lastSession: LoggedSet[];
}): number | null {
  if (input.status !== "subir") return null;
  const w = maxWeight(input.lastSession);
  if (w <= 0) return null;
  return round25(w + loadIncrement(input.group));
}

export function totalReps(sets: LoggedSet[]): number {
  return sets.reduce((acc, s) => acc + (s.reps ?? 0), 0);
}

/** Volume = carga × reps somado. Serve pra comparar sessões do exercício. */
export function totalVolume(sets: LoggedSet[]): number {
  return sets.reduce((acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
}

export function maxWeight(sets: LoggedSet[]): number {
  return sets.reduce((acc, s) => Math.max(acc, s.weightKg ?? 0), 0);
}

/** Arredonda pra 2.5kg — granularidade real de anilha. */
export function round25(n: number): number {
  return Math.round(n / 2.5) * 2.5;
}

/** Formata as reps de uma sessão como "10/9/8". */
export function formatSetLine(sets: LoggedSet[]): string {
  const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  return ordered.map((s) => s.reps ?? "—").join("/");
}

// ── Programa inicial ────────────────────────────────────────────────────────
// Semeado na primeira visita e 100% editável depois. Base: Upper A / Full
// body / Upper B, com ênfase em costas, ombro e abdômen.

export type PresetExercise = {
  name: string;
  group: MuscleGroup;
  sets: number;
  repMin: number;
  repMax: number;
  notes?: string;
};

export type PresetWorkout = { name: string; weekday: number; exercises: PresetExercise[] };

export const PRESET_PROGRAM: PresetWorkout[] = [
  {
    name: "Upper A + abdômen",
    weekday: 1,
    exercises: [
      { name: "Supino reto", group: "peito", sets: 3, repMin: 6, repMax: 10 },
      { name: "Barra fixa / puxada alta", group: "costas", sets: 3, repMin: 6, repMax: 10 },
      { name: "Remada baixa / cavalinho", group: "costas", sets: 3, repMin: 8, repMax: 12 },
      { name: "Desenvolvimento de ombro", group: "ombro", sets: 3, repMin: 6, repMax: 10 },
      { name: "Elevação lateral", group: "ombro", sets: 3, repMin: 12, repMax: 20 },
      { name: "Tríceps na polia", group: "triceps", sets: 2, repMin: 10, repMax: 15 },
      { name: "Rosca bíceps", group: "biceps", sets: 2, repMin: 10, repMax: 15 },
      { name: "Crunch na polia / máquina", group: "abdomen", sets: 3, repMin: 8, repMax: 15 },
    ],
  },
  {
    name: "Full body + abdômen",
    weekday: 3,
    exercises: [
      {
        name: "Agachamento / hack / leg press",
        group: "perna",
        sets: 3,
        repMin: 5,
        repMax: 8,
        notes: "Volume baixo e intensidade boa — manter força, não buscar hipertrofia.",
      },
      { name: "Terra romeno (RDL)", group: "posterior", sets: 3, repMin: 6, repMax: 10 },
      { name: "Supino inclinado com halteres", group: "peito", sets: 3, repMin: 8, repMax: 12 },
      { name: "Barra fixa / puxada alta", group: "costas", sets: 3, repMin: 8, repMax: 12 },
      { name: "Remada", group: "costas", sets: 2, repMin: 8, repMax: 12 },
      { name: "Panturrilha", group: "panturrilha", sets: 3, repMin: 10, repMax: 15 },
      { name: "Elevação de pernas / joelhos", group: "abdomen", sets: 3, repMin: 8, repMax: 15 },
      { name: "Pallof press", group: "abdomen", sets: 2, repMin: 10, repMax: 15, notes: "Por lado." },
    ],
  },
  {
    name: "Upper B + posterior + abdômen",
    weekday: 5,
    exercises: [
      { name: "Barra fixa / puxada alta", group: "costas", sets: 3, repMin: 6, repMax: 10 },
      { name: "Supino inclinado", group: "peito", sets: 3, repMin: 6, repMax: 10 },
      { name: "Remada unilateral", group: "costas", sets: 3, repMin: 8, repMax: 12 },
      { name: "Desenvolvimento com halteres", group: "ombro", sets: 2, repMin: 8, repMax: 12 },
      { name: "Elevação lateral", group: "ombro", sets: 3, repMin: 12, repMax: 20 },
      { name: "Mesa flexora", group: "posterior", sets: 3, repMin: 8, repMax: 15 },
      { name: "Rosca bíceps", group: "biceps", sets: 2, repMin: 10, repMax: 15 },
      { name: "Tríceps", group: "triceps", sets: 2, repMin: 10, repMax: 15 },
      { name: "Crunch com carga", group: "abdomen", sets: 3, repMin: 8, repMax: 15 },
      {
        name: "Prancha / ab wheel",
        group: "abdomen",
        sets: 3,
        repMin: 8,
        repMax: 15,
        notes: "Na prancha, contar segundos no lugar de reps.",
      },
    ],
  },
];

/** Rótulos de dia da semana, índice = Date.getDay(). */
export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Dia da semana a partir de um ISO YYYY-MM-DD, sem passar pelo fuso do servidor. */
export function weekdayFromISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
