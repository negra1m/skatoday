// Programa de calistenia por níveis — do iniciante sedentário ao nível Master.
// Adaptado 100% para peso corporal (faixa elástica e barra fixa contam como
// peso corporal; movimentos com carga externa da apostila foram trocados pela
// variação equivalente no mesmo padrão de movimento).
//
// Nada aqui toca banco nem React — é a regra de negócio pura.
// Fonte: apostila "Progressão de Calistenia" (Ashwell / Kampoori / Gaver).

export type Pattern =
  | "agachar"
  | "unilateral"
  | "dobrar_quadril"
  | "empurrar_h"
  | "empurrar_v"
  | "puxar_h"
  | "puxar_v"
  | "core"
  | "condicionamento"
  | "locomocao"
  | "skill";

export type Unit = "reps" | "seg" | "rounds";

/** 0 Reinício ... 5 Avançado, 6 Master. */
export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const MAX_LEVEL: Level = 6;

export const PATTERN_LABEL: Record<Pattern, string> = {
  agachar: "Agachar",
  unilateral: "Unilateral",
  dobrar_quadril: "Dobrar quadril",
  empurrar_h: "Empurrar horizontal",
  empurrar_v: "Empurrar vertical",
  puxar_h: "Puxar horizontal",
  puxar_v: "Puxar vertical",
  core: "Core",
  condicionamento: "Condicionamento",
  locomocao: "Locomoção",
  skill: "Skill",
};

export const UNIT_LABEL: Record<Unit, string> = {
  reps: "reps",
  seg: "s",
  rounds: "rounds",
};

// ── Níveis ──────────────────────────────────────────────────────────────────

export type LevelInfo = {
  id: Level;
  key: string;
  name: string;
  objetivo: string;
  faixa: string;
  frequencia: string;
  weekly: string;
  /** Critério de saída — marcado manualmente pelo usuário pra subir de nível. */
  exitCriteria: string[];
};

export const LEVELS: LevelInfo[] = [
  {
    id: 0,
    key: "reinicio",
    name: "Reinício",
    objetivo: "Tolerar movimento, proteger articulações e criar hábito.",
    faixa: "2-6 semanas",
    frequencia: "2 força + 4-7 caminhadas curtas",
    weekly:
      "seg força · ter caminhada · qua mobilidade · qui força · sex caminhada · sáb caminhada opcional · dom descanso",
    exitCriteria: [
      "20-30 min de atividade total num dia, sem recuperação anormal",
      "10 sentar/levantar controlados",
      "12 flexões na parede",
      "12 remadas leves",
      "Prancha elevada por 20 s",
    ],
  },
  {
    id: 1,
    key: "fundacao",
    name: "Fundação",
    objetivo: "Dominar as regressões de agachar, empurrar, puxar e core.",
    faixa: "4-8 semanas",
    frequencia: "3 força + 3-5 cardio leve",
    weekly:
      "seg força · ter caminhada · qua mobilidade · qui força · sex caminhada · sáb caminhada opcional · dom descanso",
    exitCriteria: [
      "Versões inclinadas e assistidas já não passam de RPE 7",
      "Tolerar 3 sessões por semana por pelo menos 3 semanas",
    ],
  },
  {
    id: 2,
    key: "base",
    name: "Base",
    objetivo: "Aumentar amplitude, força e volume sustentável.",
    faixa: "6-10 semanas",
    frequencia: "3 força + 2-4 cardio",
    weekly:
      "seg A · ter cardio leve · qua B · qui descanso · sex A/C alternado · sáb caminhada/shadowboxing leve · dom descanso",
    exitCriteria: [
      "Flexão inclinada com apoio ~na altura do quadril",
      "Remada invertida controlada",
      "Hang acumulado de 60-90 s",
      "Agachamentos sem perda de técnica",
    ],
  },
  {
    id: 3,
    key: "calistenia",
    name: "Calistenia",
    objetivo: "Primeiras flexões baixas, hangs e puxadas mais exigentes.",
    faixa: "8-12 semanas",
    frequencia: "3-4 força + 2 condicionamento",
    weekly:
      "seg A · ter cardio leve · qua B · qui descanso · sex A/C alternado · sáb caminhada/shadowboxing leve · dom descanso",
    exitCriteria: [
      "8-12 flexões no chão (ou versão muito baixa)",
      "5-8 chin-ups com assistência leve/moderada",
      "30 agachamentos contínuos com boa técnica",
    ],
  },
  {
    id: 4,
    key: "intermediario",
    name: "Intermediário",
    objetivo: "Consolidar força relativa; superséries no estilo Kampoori.",
    faixa: "8-16 semanas",
    frequencia: "4 sessões",
    weekly:
      "seg força · ter condicionamento leve · qua superséries · qui descanso · sex força/calistenia · sáb condicionamento/escada · dom descanso",
    exitCriteria: [
      "3-5 pull-ups/chin-ups livres ou quase livres",
      "15-20 flexões limpas",
      "5-8 dips com pouca assistência",
      "Boa recuperação entre sessões",
    ],
  },
  {
    id: 5,
    key: "avancado",
    name: "Avançado",
    objetivo: "Compostos, calistenia forte, superséries e capacidade de trabalho.",
    faixa: "12+ semanas",
    frequencia: "4-5 sessões",
    weekly:
      "seg força · ter condicionamento leve · qua superséries · qui descanso · sex força/calistenia · sáb condicionamento/escada · dom descanso",
    exitCriteria: [
      "~8-12 pull-ups",
      "12-20 dips",
      "25-40 flexões",
      "40-60 agachamentos com técnica consistente",
      "Manipular volume e intensidade sem depender de falha",
    ],
  },
  {
    id: 6,
    key: "master",
    name: "Master",
    objetivo: "Força relativa, volume, skills e condicionamento atlético sustentável.",
    faixa: "Indefinido",
    frequencia: "4-6 sessões periodizadas",
    weekly:
      "Organize em blocos: um prioriza força, outro volume, outro skills — não tudo ao mesmo tempo.",
    exitCriteria: [
      "Master não é linha de chegada: é escolher a dose certa pro objetivo certo",
      "A escada 1→10→1 de Holland é teste ocasional de atleta preparado, não rotina",
    ],
  },
];

export function levelInfo(level: number): LevelInfo {
  return LEVELS[Math.max(0, Math.min(MAX_LEVEL, level))];
}

// ── Biblioteca de exercícios (peso corporal) ────────────────────────────────

export type ExDef = {
  key: string;
  name: string;
  pattern: Pattern;
  minLevel: number;
  maxLevel: number | null; // null = até Master
  unit: Unit;
  perSide?: boolean;
  execucao: string;
  errosComuns: string;
  regressao: string;
  progressao: string;
  // Dose de referência.
  sets: number;
  min: number;
  max: number;
};

export const EXERCISES: ExDef[] = [
  // Condicionamento
  {
    key: "caminhada",
    name: "Caminhada intervalada",
    pattern: "condicionamento",
    minLevel: 0,
    maxLevel: 2,
    unit: "seg",
    execucao: "Terreno plano, passada natural. Alterne blocos de caminhada com pausas ou ritmo muito leve.",
    errosComuns: "Começar rápido demais; transformar tudo em teste; ignorar dor nos pés/joelhos.",
    regressao: "2 min caminhando + 1-2 min de pausa.",
    progressao: "Aumente o tempo total; depois reduza pausas; só então acelere.",
    sets: 1,
    min: 300,
    max: 1200,
  },
  {
    key: "marcha_apoiada",
    name: "Marcha apoiada",
    pattern: "condicionamento",
    minLevel: 0,
    maxLevel: 1,
    unit: "seg",
    execucao: "Segure leve numa parede/cadeira. Eleve um pé de cada vez sem inclinar o tronco.",
    errosComuns: "Puxar-se com os braços; bater os pés; elevar joelho além do controle.",
    regressao: "Elevação mínima do pé.",
    progressao: "Marcha sem apoio; joelho mais alto.",
    sets: 3,
    min: 20,
    max: 40,
  },
  {
    key: "shadowboxing",
    name: "Shadowboxing técnico",
    pattern: "condicionamento",
    minLevel: 1,
    maxLevel: null,
    unit: "rounds",
    execucao: "Base confortável, mãos protegendo o rosto. Jab, direto, esquivas leves e deslocamentos. Fluidez, não potência.",
    errosComuns: "Travar joelhos; socar com força sem técnica; prender respiração.",
    regressao: "Só jab e passos.",
    progressao: "Combinações mais longas; rounds de 2-3 min.",
    sets: 4,
    min: 1,
    max: 1,
  },
  // Agachar
  {
    key: "sentar_levantar",
    name: "Sentar e levantar da cadeira",
    pattern: "agachar",
    minLevel: 0,
    maxLevel: 1,
    unit: "reps",
    execucao: "Pés firmes. Incline o tronco à frente, empurre o chão e levante. Sente devagar.",
    errosComuns: "Despencar na cadeira; joelhos para dentro; impulso excessivo.",
    regressao: "Cadeira mais alta + mãos nos apoios.",
    progressao: "Cadeira mais baixa; sem mãos; box squat.",
    sets: 3,
    min: 5,
    max: 12,
  },
  {
    key: "box_squat",
    name: "Agachamento para caixa",
    pattern: "agachar",
    minLevel: 1,
    maxLevel: 2,
    unit: "reps",
    execucao: "Caixa/cadeira como referência. Quadris para trás e baixo; joelhos na direção dos pés. Toque e retorne.",
    errosComuns: "Perder tensão ao sentar; pés girarem; amplitude forçada.",
    regressao: "Caixa mais alta.",
    progressao: "Caixa mais baixa; agachamento livre.",
    sets: 3,
    min: 6,
    max: 12,
  },
  {
    key: "air_squat",
    name: "Agachamento livre",
    pattern: "agachar",
    minLevel: 3,
    maxLevel: null,
    unit: "reps",
    execucao: "Desça na amplitude em que pés, joelhos e coluna ficam controlados. Suba sem colapsar.",
    errosComuns: "Profundidade a qualquer custo; levantar calcanhares; perder estabilidade.",
    regressao: "Box squat.",
    progressao: "Tempo squat; pause squat; jump squat quando preparado.",
    sets: 4,
    min: 8,
    max: 20,
  },
  // Unilateral
  {
    key: "reverse_lunge_assistido",
    name: "Reverse lunge assistido",
    pattern: "unilateral",
    minLevel: 1,
    maxLevel: 3,
    unit: "reps",
    perSide: true,
    execucao: "Segure apoio. Passo para trás, desça até onde controla. Pé da frente inteiro apoiado.",
    errosComuns: "Passo curto; joelho da frente para dentro; empurrar demais a perna traseira.",
    regressao: "Split squat curto segurando apoio.",
    progressao: "Sem apoio; Bulgarian split squat.",
    sets: 3,
    min: 5,
    max: 10,
  },
  {
    key: "reverse_lunge",
    name: "Reverse lunge",
    pattern: "unilateral",
    minLevel: 3,
    maxLevel: null,
    unit: "reps",
    perSide: true,
    execucao: "Passo para trás controlado, quadris descem entre as pernas, tronco firme. Retorne estável.",
    errosComuns: "Bater joelho no chão; perder equilíbrio; fazer rápido demais.",
    regressao: "Assistido.",
    progressao: "Bulgarian split squat; déficit; progressão de pistol.",
    sets: 3,
    min: 6,
    max: 12,
  },
  // Dobrar quadril (posterior) — substituições peso corporal
  {
    key: "hinge_parede",
    name: "Hinge na parede",
    pattern: "dobrar_quadril",
    minLevel: 0,
    maxLevel: 2,
    unit: "reps",
    execucao: "De costas para a parede a pequena distância. Leve o quadril para trás até tocá-la, coluna longa.",
    errosComuns: "Virar agachamento; arredondar lombar; jogar a cabeça para cima.",
    regressao: "Parede mais próxima.",
    progressao: "Parede mais distante; single-leg RDL.",
    sets: 3,
    min: 8,
    max: 12,
  },
  {
    key: "ponte_gluteos",
    name: "Ponte de glúteos",
    pattern: "dobrar_quadril",
    minLevel: 0,
    maxLevel: 3,
    unit: "reps",
    execucao: "Deitado, pés próximos dos glúteos. Contraia abdômen e glúteos, eleve o quadril até a linha confortável.",
    errosComuns: "Hiperestender lombar; empurrar pela ponta dos pés; joelhos colapsarem.",
    regressao: "Amplitude parcial.",
    progressao: "Faixa acima dos joelhos; unilateral.",
    sets: 3,
    min: 8,
    max: 15,
  },
  {
    key: "single_leg_rdl",
    name: "Single-leg RDL (peso corporal)",
    pattern: "dobrar_quadril",
    minLevel: 2,
    maxLevel: 5,
    unit: "reps",
    perSide: true,
    execucao: "Em pé numa perna, empurre o quadril para trás e desça o tronco mantendo coluna longa; volte com o glúteo.",
    errosComuns: "Perder o equilíbrio; arredondar lombar; girar o quadril.",
    regressao: "Hinge na parede; toque leve do pé de trás no chão.",
    progressao: "Maior amplitude/pausa; depois nórdico.",
    sets: 3,
    min: 8,
    max: 12,
  },
  {
    key: "nordico",
    name: "Nórdico (flexora nórdica) assistido",
    pattern: "dobrar_quadril",
    minLevel: 4,
    maxLevel: null,
    unit: "reps",
    execucao: "Joelhos apoiados, pés fixos. Desça o tronco rígido o mais lento possível e empurre de volta com as mãos se precisar.",
    errosComuns: "Dobrar no quadril; soltar o tronco de uma vez; amplitude maior que o controle.",
    regressao: "Ponte unilateral; amplitude curta com forte apoio das mãos.",
    progressao: "Menos empurrão das mãos; amplitude total; nórdico completo.",
    sets: 3,
    min: 4,
    max: 8,
  },
  // Empurrar horizontal
  {
    key: "flexao_parede",
    name: "Flexão na parede",
    pattern: "empurrar_h",
    minLevel: 0,
    maxLevel: 1,
    unit: "reps",
    execucao: "Mãos na parede na altura do peito. Corpo em bloco. Flexione os cotovelos e empurre a parede.",
    errosComuns: "Quadril para trás; cabeça avançar; cotovelos totalmente abertos.",
    regressao: "Mais vertical e perto da parede.",
    progressao: "Afastar os pés; apoio em bancada.",
    sets: 3,
    min: 6,
    max: 15,
  },
  {
    key: "flexao_inclinada",
    name: "Flexão inclinada",
    pattern: "empurrar_h",
    minLevel: 1,
    maxLevel: 3,
    unit: "reps",
    execucao: "Mãos numa bancada firme, corpo alinhado. Desça o peito entre as mãos com abdômen e glúteos ativos.",
    errosComuns: "Superfície instável; lombar cair; amplitude maior que o controle.",
    regressao: "Apoio mais alto.",
    progressao: "Apoio mais baixo até chegar ao chão.",
    sets: 3,
    min: 6,
    max: 15,
  },
  {
    key: "flexao_chao",
    name: "Flexão no chão",
    pattern: "empurrar_h",
    minLevel: 3,
    maxLevel: null,
    unit: "reps",
    execucao: "Mãos pouco além dos ombros, corpo rígido. Desça com controle e empurre com escápulas livres.",
    errosComuns: "Cotovelo a 90° do tronco; quadril afundar; pescoço projetado.",
    regressao: "Flexão inclinada.",
    progressao: "Pés elevados; archer.",
    sets: 3,
    min: 6,
    max: 25,
  },
  // Empurrar vertical — substituições peso corporal (sem kettlebell)
  {
    key: "pike_pushup",
    name: "Pike push-up",
    pattern: "empurrar_v",
    minLevel: 3,
    maxLevel: 5,
    unit: "reps",
    execucao: "Em V invertido, quadril alto. Desça a cabeça em direção ao chão entre as mãos e empurre de volta.",
    errosComuns: "Lombar afundar; cotovelos abrirem; amplitude dolorosa no ombro.",
    regressao: "Pés no chão com quadril menos alto; flexão inclinada.",
    progressao: "Pés elevados (pike elevado).",
    sets: 3,
    min: 5,
    max: 12,
  },
  {
    key: "pike_elevado",
    name: "Pike push-up com pés elevados",
    pattern: "empurrar_v",
    minLevel: 4,
    maxLevel: null,
    unit: "reps",
    execucao: "Pés numa superfície firme, quadril acima da cabeça. Desça a cabeça ao chão e empurre.",
    errosComuns: "Perder a verticalidade; ombros nas orelhas; pescoço projetado.",
    regressao: "Pike no chão.",
    progressao: "Wall handstand push-up.",
    sets: 3,
    min: 5,
    max: 10,
  },
  {
    key: "wall_hspu",
    name: "Handstand push-up na parede",
    pattern: "empurrar_v",
    minLevel: 5,
    maxLevel: null,
    unit: "reps",
    execucao: "Parado de cabeça para baixo contra a parede. Desça a cabeça ao chão com controle e empurre de volta.",
    errosComuns: "Arquear a lombar; descer sem controle; amplitude dolorosa.",
    regressao: "Pike elevado; amplitude parcial.",
    progressao: "Amplitude total; pausa no fundo.",
    sets: 3,
    min: 3,
    max: 8,
  },
  // Puxar horizontal
  {
    key: "remada_faixa",
    name: "Remada com faixa",
    pattern: "puxar_h",
    minLevel: 0,
    maxLevel: 2,
    unit: "reps",
    execucao: "Faixa presa em ponto seguro. Puxe os cotovelos para trás aproximando as mãos do tronco, sem encolher os ombros.",
    errosComuns: "Puxar com o pescoço; inclinar para trás; soltar a volta.",
    regressao: "Faixa leve.",
    progressao: "Faixa mais forte; remada invertida.",
    sets: 3,
    min: 8,
    max: 15,
  },
  {
    key: "remada_invertida_alta",
    name: "Remada invertida alta",
    pattern: "puxar_h",
    minLevel: 1,
    maxLevel: 3,
    unit: "reps",
    execucao: "Barra baixa/TRX bem estável, corpo inclinado. Puxe o peito em direção às mãos e controle a descida.",
    errosComuns: "Quadril cair; ombros subirem; puxar só com o bíceps.",
    regressao: "Corpo mais vertical.",
    progressao: "Corpo mais horizontal; pés elevados.",
    sets: 3,
    min: 6,
    max: 12,
  },
  {
    key: "remada_invertida",
    name: "Remada invertida",
    pattern: "puxar_h",
    minLevel: 2,
    maxLevel: 5,
    unit: "reps",
    execucao: "Corpo mais horizontal sob a barra. Puxe o peito à barra mantendo quadril e core firmes.",
    errosComuns: "Quadril cair; meia amplitude; balançar.",
    regressao: "Remada invertida alta.",
    progressao: "Pés elevados; pausa no topo.",
    sets: 4,
    min: 6,
    max: 12,
  },
  // Puxar vertical
  {
    key: "hang_assistido",
    name: "Hang assistido",
    pattern: "puxar_v",
    minLevel: 1,
    maxLevel: 3,
    unit: "seg",
    execucao: "Segure a barra com os pés ainda apoiados em caixa/chão. Deixe parte do peso nos braços, sem dor.",
    errosComuns: "Saltar para a barra; dor no ombro; soltar a pegada de repente.",
    regressao: "Menos peso nos braços.",
    progressao: "Dead hang completo.",
    sets: 3,
    min: 10,
    max: 30,
  },
  {
    key: "dead_hang",
    name: "Dead hang",
    pattern: "puxar_v",
    minLevel: 2,
    maxLevel: 5,
    unit: "seg",
    execucao: "Pendure-se da barra com pegada confortável. Respire. Posição passiva ou levemente ativa.",
    errosComuns: "Prender a respiração; insistir com dor; descer saltando.",
    regressao: "Hang assistido.",
    progressao: "Active hang; scapular pull-up.",
    sets: 3,
    min: 15,
    max: 45,
  },
  {
    key: "scapular_pullup",
    name: "Scapular pull-up",
    pattern: "puxar_v",
    minLevel: 2,
    maxLevel: 4,
    unit: "reps",
    execucao: "Do hang, cotovelos estendidos, mova as escápulas para elevar levemente o corpo. Retorne com controle.",
    errosComuns: "Dobrar os cotovelos; encolher ombros; balançar.",
    regressao: "Versão com pés apoiados.",
    progressao: "Pull-up assistido.",
    sets: 3,
    min: 5,
    max: 10,
  },
  {
    key: "chinup_assistido",
    name: "Chin-up assistido",
    pattern: "puxar_v",
    minLevel: 3,
    maxLevel: 5,
    unit: "reps",
    execucao: "Pegada supinada. Use faixa ou apoio dos pés para completar reps limpas. Leve o peito para cima sem chutar.",
    errosComuns: "Faixa forte demais mascarando técnica; balançar; encurtar a descida.",
    regressao: "Pulldown/faixa + hangs.",
    progressao: "Menos assistência; chin-up livre.",
    sets: 4,
    min: 3,
    max: 8,
  },
  {
    key: "pullup",
    name: "Pull-up / Chin-up",
    pattern: "puxar_v",
    minLevel: 4,
    maxLevel: null,
    unit: "reps",
    execucao: "Do hang controlado, puxe levando os cotovelos para baixo, passe o queixo da barra e desça com controle.",
    errosComuns: "Kipping involuntário; meia repetição; falhar em toda série.",
    regressao: "Assistido.",
    progressao: "Pausa no topo; chest-to-bar; pull-up com variação difícil.",
    sets: 4,
    min: 3,
    max: 10,
  },
  // Core
  {
    key: "dead_bug",
    name: "Dead bug",
    pattern: "core",
    minLevel: 0,
    maxLevel: 3,
    unit: "reps",
    perSide: true,
    execucao: "Deitado, quadris/joelhos flexionados. Tronco estável enquanto afasta braço/perna opostos. Volte antes de perder a lombar neutra.",
    errosComuns: "Amplitude grande demais; prender a respiração; acelerar.",
    regressao: "Mover só braços ou só pernas.",
    progressao: "Extensão completa contralateral; faixa.",
    sets: 3,
    min: 5,
    max: 10,
  },
  {
    key: "prancha_elevada",
    name: "Prancha elevada",
    pattern: "core",
    minLevel: 0,
    maxLevel: 2,
    unit: "seg",
    execucao: "Mãos numa superfície firme. Contraia leve glúteos e abdômen. Cabeça, tronco e quadris alinhados.",
    errosComuns: "Prender a respiração; quadril cair; ombros nas orelhas.",
    regressao: "Superfície mais alta.",
    progressao: "Apoio mais baixo; prancha no chão.",
    sets: 3,
    min: 10,
    max: 30,
  },
  {
    key: "prancha_chao",
    name: "Prancha no chão",
    pattern: "core",
    minLevel: 2,
    maxLevel: 5,
    unit: "seg",
    execucao: "Apoie antebraços ou mãos. Tensão suficiente para manter costelas e pelve controladas enquanto respira.",
    errosComuns: "Competir por tempo com técnica ruim; lombar cair; glúteos altos.",
    regressao: "Prancha elevada.",
    progressao: "Long-lever plank; shoulder taps.",
    sets: 3,
    min: 20,
    max: 60,
  },
  {
    key: "knee_raise",
    name: "Elevação de joelhos apoiada",
    pattern: "core",
    minLevel: 2,
    maxLevel: 4,
    unit: "reps",
    execucao: "Em estação de apoio ou suspenso, ombros firmes, eleve os joelhos até onde controla sem balançar.",
    errosComuns: "Usar impulso; arredondar agressivamente; ombros colapsarem.",
    regressao: "Reverse crunch no chão.",
    progressao: "Knee raise suspenso; pernas retas.",
    sets: 3,
    min: 6,
    max: 15,
  },
  {
    key: "leg_raise_paralelas",
    name: "Elevação de pernas nas paralelas",
    pattern: "core",
    minLevel: 4,
    maxLevel: null,
    unit: "reps",
    execucao: "Sustente o corpo nas barras. Eleve as pernas estendidas até a amplitude possível sem balanço e retorne devagar.",
    errosComuns: "Chutar; perder depressão escapular; sacrificar a coluna por amplitude.",
    regressao: "Knee raise.",
    progressao: "L-sit raises; pausas.",
    sets: 3,
    min: 6,
    max: 15,
  },
  // Locomoção
  {
    key: "bear_crawl",
    name: "Bear crawl",
    pattern: "locomocao",
    minLevel: 2,
    maxLevel: 5,
    unit: "seg",
    execucao: "Mãos sob os ombros, joelhos baixos. Avance mão e pé opostos em passos curtos, quadris estáveis.",
    errosComuns: "Passos gigantes; quadril balançar; velocidade antes de controle.",
    regressao: "Bear hold estático.",
    progressao: "Mais distância; direções variadas.",
    sets: 4,
    min: 15,
    max: 40,
  },
  // Empurrar vertical + core (dips)
  {
    key: "dip_assistido",
    name: "Dip assistido",
    pattern: "empurrar_v",
    minLevel: 2,
    maxLevel: 4,
    unit: "reps",
    execucao: "Use faixa ou pés apoiados. Desça até amplitude confortável, ombros organizados, antebraços quase verticais.",
    errosComuns: "Descer além da mobilidade; ombros rodarem à frente; cotovelos abrirem muito.",
    regressao: "Bench push-up / suporte em paralelas.",
    progressao: "Menos assistência; dip livre.",
    sets: 3,
    min: 4,
    max: 10,
  },
  {
    key: "dip",
    name: "Dip",
    pattern: "empurrar_v",
    minLevel: 4,
    maxLevel: null,
    unit: "reps",
    execucao: "Comece em suporte alto. Incline o tronco conforme o objetivo, desça com controle e empurre até a estabilidade.",
    errosComuns: "Afundar os ombros; amplitude dolorosa; rebote no fundo.",
    regressao: "Assistido.",
    progressao: "Dip com pausa; dip-to-knee-tuck.",
    sets: 4,
    min: 3,
    max: 12,
  },
  {
    key: "dip_knee_tuck",
    name: "Dip to knee tuck",
    pattern: "empurrar_v",
    minLevel: 5,
    maxLevel: null,
    unit: "reps",
    execucao: "Um dip limpo; ao voltar ao suporte, estabilize e então eleve os joelhos ao peito sem balanço.",
    errosComuns: "Emendar o knee tuck antes de estabilizar; balanço; fadiga destruir o dip.",
    regressao: "Dip + knee raise separados.",
    progressao: "Pernas mais estendidas.",
    sets: 3,
    min: 5,
    max: 10,
  },
  // Capacidade de trabalho
  {
    key: "escada",
    name: "Escada 1-2-3-4-5 adaptada",
    pattern: "condicionamento",
    minLevel: 3,
    maxLevel: null,
    unit: "rounds",
    execucao:
      "Unidade = 1 puxada, 2 dips/press, 3 flexões, 4 de core, 5 agachamentos. Suba só até o degrau planejado, com versões adequadas.",
    errosComuns: "Exercícios avançados cedo demais; correr; ir à falha no início.",
    regressao: "1→3 e pare.",
    progressao: "1→5; depois 1→7; só atleta preparado testa 1→10→1.",
    sets: 1,
    min: 1,
    max: 1,
  },
  // Skills (Master)
  {
    key: "handstand_prog",
    name: "Progressão de handstand",
    pattern: "skill",
    minLevel: 6,
    maxLevel: null,
    unit: "seg",
    execucao: "Progressões de parada de mão: wall hold, ombros empilhados, sem fadiga desnecessária.",
    errosComuns: "Arquear demais; treinar cansado; pular etapas.",
    regressao: "Pike hold / wall plank.",
    progressao: "Menos apoio na parede; equilíbrio livre.",
    sets: 4,
    min: 10,
    max: 40,
  },
  {
    key: "lsit_prog",
    name: "Progressão de L-sit",
    pattern: "skill",
    minLevel: 6,
    maxLevel: null,
    unit: "seg",
    execucao: "Suporte firme, depressão escapular. Eleve os joelhos/pernas e sustente sem encolher os ombros.",
    errosComuns: "Ombros nas orelhas; prender a respiração; perder a depressão escapular.",
    regressao: "Tuck hold.",
    progressao: "Advanced tuck; pernas estendidas.",
    sets: 4,
    min: 8,
    max: 30,
  },
];

export const EXERCISE_BY_KEY: Record<string, ExDef> = Object.fromEntries(
  EXERCISES.map((e) => [e.key, e]),
);

// ── Programas por nível ─────────────────────────────────────────────────────

export type ProgramItem = { key: string; sets: number; min: number; max: number; note?: string };
export type ProgramBlock = { block: string; title: string; items: ProgramItem[] };
export type LevelProgram = { level: Level; blocks: ProgramBlock[] };

const it = (key: string, sets: number, min: number, max: number, note?: string): ProgramItem => ({
  key,
  sets,
  min,
  max,
  note,
});

export const PROGRAMS: LevelProgram[] = [
  {
    level: 0,
    blocks: [
      {
        block: "A",
        title: "Reinício A",
        items: [
          it("sentar_levantar", 2, 5, 8),
          it("flexao_parede", 2, 6, 10),
          it("remada_faixa", 2, 8, 12),
          it("ponte_gluteos", 2, 8, 12),
          it("caminhada", 1, 300, 900),
        ],
      },
      {
        block: "B",
        title: "Reinício B",
        items: [
          it("hinge_parede", 2, 8, 8),
          it("marcha_apoiada", 3, 20, 30),
          it("flexao_parede", 2, 6, 10),
          it("dead_bug", 2, 5, 5),
          it("caminhada", 1, 300, 600),
        ],
      },
    ],
  },
  {
    level: 1,
    blocks: [
      {
        block: "A",
        title: "Fundação A",
        items: [
          it("box_squat", 3, 6, 10),
          it("flexao_inclinada", 3, 6, 10),
          it("remada_faixa", 3, 10, 15),
          it("ponte_gluteos", 3, 10, 15),
          it("prancha_elevada", 3, 15, 25),
        ],
      },
      {
        block: "B",
        title: "Fundação B",
        items: [
          it("reverse_lunge_assistido", 2, 5, 8),
          it("flexao_inclinada", 3, 8, 12),
          it("remada_invertida_alta", 3, 6, 10),
          it("hinge_parede", 3, 10, 10),
          it("shadowboxing", 4, 1, 1, "rounds de ~60 s"),
        ],
      },
    ],
  },
  {
    level: 2,
    blocks: [
      {
        block: "A",
        title: "Base A",
        items: [
          it("box_squat", 3, 8, 8),
          it("flexao_inclinada", 4, 6, 12),
          it("remada_invertida", 4, 6, 10),
          it("hang_assistido", 4, 15, 25),
          it("prancha_chao", 3, 20, 30),
        ],
      },
      {
        block: "B",
        title: "Base B",
        items: [
          it("single_leg_rdl", 3, 8, 10),
          it("reverse_lunge", 3, 6, 6),
          it("flexao_inclinada", 3, 10, 10),
          it("scapular_pullup", 3, 6, 8),
          it("bear_crawl", 4, 15, 15),
        ],
      },
    ],
  },
  {
    level: 3,
    blocks: [
      {
        block: "A",
        title: "Calistenia A — força",
        items: [
          it("air_squat", 4, 8, 8),
          it("flexao_inclinada", 4, 6, 10, "apoio baixo"),
          it("chinup_assistido", 4, 4, 6),
          it("single_leg_rdl", 3, 8, 8),
          it("prancha_chao", 3, 30, 45),
        ],
      },
      {
        block: "B",
        title: "Calistenia B — volume",
        items: [
          it("reverse_lunge", 3, 8, 8),
          it("flexao_chao", 5, 6, 10, "séries submáximas"),
          it("remada_invertida", 4, 8, 12),
          it("knee_raise", 3, 8, 12),
          it("shadowboxing", 5, 1, 1, "rounds de ~90 s"),
        ],
      },
      {
        block: "C",
        title: "Calistenia C — escada",
        items: [it("escada", 1, 1, 1, "1→3, versões regressivas")],
      },
    ],
  },
  {
    level: 4,
    blocks: [
      {
        block: "A",
        title: "Intermediário A",
        items: [
          it("nordico", 4, 5, 5),
          it("flexao_chao", 4, 8, 15),
          it("chinup_assistido", 5, 4, 6),
          it("reverse_lunge", 3, 8, 8),
          it("knee_raise", 3, 10, 10),
        ],
      },
      {
        block: "B",
        title: "Intermediário B — superséries",
        items: [
          it("air_squat", 3, 8, 10, "supersérie com pike push-up"),
          it("pike_pushup", 3, 8, 10),
          it("remada_invertida", 3, 8, 10, "supersérie com bear crawl"),
          it("bear_crawl", 3, 20, 20),
          it("dip_assistido", 3, 6, 10, "supersérie com prancha"),
          it("prancha_chao", 3, 30, 30),
        ],
      },
      {
        block: "C",
        title: "Intermediário C — condicionamento",
        items: [
          it("shadowboxing", 6, 1, 1, "rounds de 2 min"),
          it("escada", 1, 1, 1, "1→5, sem retorno, RPE máx 8"),
        ],
      },
    ],
  },
  {
    level: 5,
    blocks: [
      {
        block: "A",
        title: "Avançado A — Ashwell adaptado",
        items: [
          it("nordico", 4, 5, 8),
          it("pike_elevado", 4, 8, 10),
          it("leg_raise_paralelas", 4, 10, 15),
          it("dip", 4, 6, 12),
        ],
      },
      {
        block: "B",
        title: "Avançado B — Kampoori adaptado (superséries)",
        items: [
          it("shadowboxing", 1, 1, 1, "3 min de aquecimento"),
          it("pike_pushup", 3, 8, 10, "supersérie com ponte unilateral"),
          it("single_leg_rdl", 3, 10, 10),
          it("nordico", 3, 5, 6, "supersérie com chin-up"),
          it("chinup_assistido", 3, 4, 6),
          it("box_squat", 3, 10, 10, "supersérie com flexão"),
          it("flexao_chao", 3, 10, 12),
          it("reverse_lunge", 3, 8, 8, "supersérie com dip-to-knee-tuck regressão"),
        ],
      },
      {
        block: "C",
        title: "Avançado C — calistenia",
        items: [
          it("pullup", 5, 3, 8),
          it("dip", 5, 4, 10),
          it("flexao_chao", 4, 15, 25),
          it("air_squat", 4, 20, 20),
          it("leg_raise_paralelas", 4, 10, 12),
        ],
      },
      {
        block: "D",
        title: "Avançado D — escada",
        items: [it("escada", 1, 1, 1, "1→5→1 ou 1→7, sem retorno")],
      },
    ],
  },
  {
    level: 6,
    blocks: [
      {
        block: "1",
        title: "Master — força",
        items: [
          it("nordico", 4, 5, 6),
          it("pike_elevado", 4, 5, 8),
          it("pullup", 5, 3, 6, "variação difícil ou lastro corporal"),
          it("leg_raise_paralelas", 4, 8, 12),
        ],
      },
      {
        block: "2",
        title: "Master — skill",
        items: [
          it("handstand_prog", 4, 10, 40),
          it("lsit_prog", 4, 8, 30),
          it("bear_crawl", 3, 30, 30),
        ],
      },
      {
        block: "3",
        title: "Master — volume",
        items: [
          it("pullup", 4, 5, 8),
          it("dip", 4, 8, 12),
          it("flexao_chao", 4, 20, 25),
          it("air_squat", 4, 20, 30),
        ],
      },
      {
        block: "4",
        title: "Master — condicionamento",
        items: [
          it("shadowboxing", 6, 1, 1, "rounds de 2-3 min"),
          it("escada", 1, 1, 1, "1→7 ou teste 1→10→1 ocasional"),
        ],
      },
    ],
  },
];

export function programForLevel(level: number): LevelProgram {
  const lvl = Math.max(0, Math.min(MAX_LEVEL, level)) as Level;
  return PROGRAMS.find((p) => p.level === lvl) ?? PROGRAMS[0];
}

// ── Dupla progressão ────────────────────────────────────────────────────────
// Calistenia avança nesta ordem: controle → reps → amplitude → séries →
// alavanca mais difícil → carga. Aqui medimos só o gatilho objetivo: fechou o
// topo da faixa em todas as séries com RPE controlado → hora de dificultar.

export type ProgressReady = "sem_dados" | "manter" | "pronto";
export type LoggedSet = { value: number | null; rpe: number | null };

/**
 * `value` é reps OU segundos, conforme a unidade do exercício.
 * Pronto para dificultar quando todas as séries previstas atingem o topo da
 * faixa e o RPE da sessão ficou em 8 ou menos (2+ reps na reserva).
 */
export function progressReady(input: {
  sets: number;
  max: number;
  logged: LoggedSet[];
}): ProgressReady {
  const done = input.logged.filter((s) => s.value != null && s.value > 0);
  if (done.length === 0) return "sem_dados";
  const hitTop = done.length >= input.sets && done.every((s) => (s.value as number) >= input.max);
  const rpes = done.map((s) => s.rpe).filter((r): r is number => r != null);
  const controlled = rpes.length === 0 || Math.max(...rpes) <= 8;
  return hitTop && controlled ? "pronto" : "manter";
}

export const RPE_SCALE: { rpe: number; label: string; reserva: string }[] = [
  { rpe: 5, label: "Leve", reserva: "5+ na reserva" },
  { rpe: 6, label: "Moderado", reserva: "4 na reserva" },
  { rpe: 7, label: "Desafiador controlado", reserva: "3 na reserva" },
  { rpe: 8, label: "Difícil", reserva: "2 na reserva" },
  { rpe: 9, label: "Muito difícil", reserva: "1 na reserva" },
  { rpe: 10, label: "Falha", reserva: "0 — não é meta" },
];

/** Formata as séries feitas como "10/9/8" (reps) ou "30/25/20" (segundos). */
export function formatSetLine(sets: Array<{ value: number | null }>): string {
  return sets.map((s) => s.value ?? "—").join("/");
}

// ── Utilidades de calendário (mantidas) ─────────────────────────────────────

/** Rótulos de dia da semana, índice = Date.getDay(). */
export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Dia da semana a partir de um ISO YYYY-MM-DD, sem passar pelo fuso do servidor. */
export function weekdayFromISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
