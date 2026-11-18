// Circuito Diário de 20 Minutos (Halteres + Chão).
// Treino único, fixo, feito todos os dias. A serviço de manter o ritmo e
// perder peso pra voltar a correr sem detonar o joelho.
//
// A calistenia por níveis fica desligada por enquanto (volta com o flag).

/** Liga/desliga o programa de calistenia por níveis na aba Academia. */
export const CALISTENIA_ENABLED = false;

/** Meta da fase base: 90 treinos feitos (~3 meses de ritmo diário). */
export const BASE_GOAL = 90;

export type CircuitExercise = {
  key: string;
  nome: string;
  foco: string;
  reps: string;
  instrucao: string;
  alternativa: string;
};

export type Circuit = {
  titulo: string;
  resumo: string;
  duracaoMin: number;
  voltasAlvo: string;
  descansoEntreSeg: string;
  descansoEntreVoltasSeg: string;
  exercicios: CircuitExercise[];
  ajustes: string[];
};

export const CIRCUIT: Circuit = {
  titulo: "Circuito Diário · 20 min",
  resumo:
    "Faça os 4 exercícios em sequência, descansando 20–30s entre eles. Ao fechar os 4, descanse 60–90s e repita até completar os 20 minutos (cerca de 4 a 5 voltas).",
  duracaoMin: 20,
  voltasAlvo: "4–5",
  descansoEntreSeg: "20–30s",
  descansoEntreVoltasSeg: "60–90s",
  exercicios: [
    {
      key: "flexao_supino",
      nome: "Flexão no chão ou supino no chão",
      foco: "Peito e tríceps",
      reps: "12–15",
      instrucao:
        "Flexão tradicional no chão, ou deitado de barriga pra cima empurrando os dois halteres pro alto (supino no chão). Com halteres, encoste os cotovelos suavemente no chão antes de empurrar pra cima.",
      alternativa: "Flexão ↔ supino com halteres",
    },
    {
      key: "remada_curvada",
      nome: "Remada curvada com halteres",
      foco: "Costas e posterior de ombro",
      reps: "15–20",
      instrucao:
        "Em pé, tronco inclinado pra frente, coluna reta e joelhos levemente dobrados. Puxe os dois halteres em direção à linha do umbigo, apertando as escápulas no topo, e desça devagar.",
      alternativa: "—",
    },
    {
      key: "rosca",
      nome: "Rosca direta ou rosca martelo",
      foco: "Bíceps",
      reps: "12–18",
      instrucao:
        "Em pé, cotovelos colados ao corpo, suba os halteres sem balançar o tronco. Alterne os dias entre rosca direta (palmas pra frente) e rosca martelo (palmas uma pra outra, estilo pegando um martelo).",
      alternativa: "Direta ↔ martelo (alterna os dias)",
    },
    {
      key: "triceps",
      nome: "Tríceps testa no chão ou coice",
      foco: "Tríceps",
      reps: "12–18",
      instrucao:
        "Deitado no chão, braços esticados pra cima segurando os halteres, dobre só os cotovelos levando os pesos ao lado das orelhas e estique de volta. Em pé: incline o tronco (como na remada), trave os cotovelos altos e estique os antebraços pra trás (coice).",
      alternativa: "Testa no chão ↔ coice em pé",
    },
  ],
  ajustes: [
    "Halteres leves: aumente o tempo sob tensão — leve 3s pra descer o peso em cada repetição e não descanse no ponto fácil do movimento.",
    "Halteres pesados: faça menos reps por volta (8–12) e priorize o supino no chão em vez da flexão se os braços cansarem antes da hora.",
  ],
};

// ── Lembretes (janela + N por dia) ───────────────────────────────────────────
// Mesma ideia da água: espalha N horários iguais entre início e fim da janela.

export function buildReminderSchedule(windowStart: string, windowEnd: string, count: number): string[] {
  const n = Math.max(1, Math.floor(count));
  const [sh, sm] = windowStart.split(":").map(Number);
  const [eh, em] = windowEnd.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return [];
  if (n === 1) return [windowStart];
  const out: string[] = [];
  const step = (endMin - startMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const m = Math.round(startMin + step * i);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

/** Próximo horário de lembrete ainda não passado hoje, ou null. */
export function nextReminderTime(schedule: string[], now = new Date()): string | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const t of schedule) {
    const [h, m] = t.split(":").map(Number);
    if (h * 60 + m > cur) return t;
  }
  return null;
}

/**
 * Dias seguidos de treino feito, contando de trás pra frente a partir de hoje.
 * Aceita que hoje ainda não tenha sido feito: a sequência vale até ontem.
 * `doneDates` = datas YYYY-MM-DD com treino feito (done=true).
 */
export function circuitStreak(doneDates: string[], today: string): number {
  const set = new Set(doneDates);
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  // Se hoje não foi feito, começa a contagem a partir de ontem.
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
