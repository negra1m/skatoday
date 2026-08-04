/**
 * Tráfego pago — doutrina de operação e helpers.
 *
 * O checklist é editável pela UI (vive no banco, por campanha). O que está
 * aqui é só a SEMENTE usada quando uma campanha nasce, mais o material de
 * referência (regras de decisão, red flags, glossário) que não é tarefa e
 * portanto não vira linha de checklist.
 */

export type ChecklistSection = "setup" | "diaria" | "semanal";

export const SECTION_LABEL: Record<ChecklistSection, string> = {
  setup: "Setup inicial",
  diaria: "Rotina diária",
  semanal: "Rotina semanal",
};

export const SECTION_HINT: Record<ChecklistSection, string> = {
  setup: "Uma vez só, antes do primeiro anúncio",
  diaria: "15 min, nos dias de trabalho",
  semanal: "30 min, uma vez por semana",
};

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  planejando: "Planejando",
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

export const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  planejando: "bg-blue-500",
  ativa: "bg-emerald-500",
  pausada: "bg-amber-500",
  encerrada: "bg-zinc-400",
};

export const LEAD_STAGE_LABEL: Record<string, string> = {
  novo: "Novo",
  contato: "Contato",
  visita: "Visita",
  proposta: "Proposta",
  vendido: "Vendido",
  perdido: "Perdido",
};

export const LEAD_STAGE_COLOR: Record<string, string> = {
  novo: "bg-blue-500",
  contato: "bg-cyan-500",
  visita: "bg-violet-500",
  proposta: "bg-amber-500",
  vendido: "bg-emerald-500",
  perdido: "bg-red-500",
};

export const LEAD_STAGES = [
  "novo",
  "contato",
  "visita",
  "proposta",
  "vendido",
  "perdido",
] as const;

// ---------------------------------------------------------------------------
// Semente do checklist
// ---------------------------------------------------------------------------

type SeedItem = { section: ChecklistSection; label: string; detail?: string };

/**
 * Checklist inicial de uma campanha. O nome do cliente entra no texto pra
 * deixar explícito de quem é a conta e de quem é o cartão.
 */
export function seedChecklist(clientName: string): SeedItem[] {
  const c = clientName.trim() || "o cliente";
  return [
    // ---- Setup inicial ----
    {
      section: "setup",
      label: "Abrir o Gerenciador de Anúncios pelo Business Manager",
      detail: `business.facebook.com — conferir que a conta de anúncios é a de ${c} e que o cartão é dele(a). Verba nunca passa pela Few.`,
    },
    {
      section: "setup",
      label: "Conferir o Instagram vinculado à conta",
      detail: `O perfil de ${c} tem que estar vinculado antes de subir anúncio.`,
    },
    {
      section: "setup",
      label: "Rodar o INIEC com a URL do imóvel",
      detail: 'Campo "Analisar URL" → anotar as 5–10 melhores cidades.',
    },
    {
      section: "setup",
      label: "Criar a campanha com objetivo Conversas no WhatsApp",
      detail: "Engajamento → Conversas no WhatsApp. O lead cai direto no WhatsApp, que é onde converte.",
    },
    {
      section: "setup",
      label: "Montar a segmentação",
      detail:
        'Cidades do INIEC + praças-alvo + região do imóvel. Idade 30–65. Localização: "pessoas que moram neste local" (nunca "recentemente no local" — pega turista).',
    },
    {
      section: "setup",
      label: "Definir orçamento DIÁRIO (não vitalício)",
      detail: "Verba do mês ÷ 30. Diário dá controle; vitalício gasta como quer.",
    },
    {
      section: "setup",
      label: "Subir o criativo",
      detail: "Vídeo do imóvel (drone + tour) com texto direto: o que é, onde é, faixa de preço, “chame no WhatsApp”.",
    },
    {
      section: "setup",
      label: "Conferir a prévia nos formatos",
      detail: "Feed, stories e reels — cada um corta diferente.",
    },
    {
      section: "setup",
      label: "Abrir a planilha Leads Tráfego",
      detail: "Data, nome, telefone, campanha/imóvel, etapa, observação. É ela que sustenta a comissão.",
    },
    {
      section: "setup",
      label: "Nunca impulsionar pelo app do iPhone",
      detail: "A Apple cobra +30% em cima. Sempre pelo Gerenciador (web).",
    },

    // ---- Rotina diária ----
    {
      section: "diaria",
      label: "1. Gastou?",
      detail:
        'Coluna "Valor gasto" de ontem bate com a verba diária? Se gastou R$ 0: campanha rejeitada, pagamento recusado ou saldo — resolver HOJE, dia parado é verba perdida.',
    },
    {
      section: "diaria",
      label: "2. Gastou ONDE?",
      detail:
        "Detalhamento → Entrega → Região. Tem que ser ~100% nas praças-alvo. Entrega fora do padrão = a lição do Irã se repetindo → pausar e revisar segmentação.",
    },
    {
      section: "diaria",
      label: "3. Quantas conversas?",
      detail: 'Coluna "Conversas iniciadas". É O número que importa — view e curtida não pagam boleto.',
    },
    {
      section: "diaria",
      label: "4. Quanto custou cada conversa?",
      detail:
        "Gasto ÷ conversas. As primeiras 2 semanas servem pra descobrir o SEU número normal; depois, o alerta é ele subir 50%+ acima da média.",
    },
    {
      section: "diaria",
      label: "5. Chegou lead novo?",
      detail:
        "Registrar AGORA na aba Leads + pedir pra marcar a origem no CRM do cliente. Lead sem registro = comissão perdida.",
    },
    {
      section: "diaria",
      label: "6. Comentários no anúncio?",
      detail: "Responder dúvidas, apagar spam. Comentário sem resposta espanta comprador.",
    },
    {
      section: "diaria",
      label: "7. Lançar o log do dia",
      detail: "Data, gasto, conversas, custo/conversa e uma linha de observação — na aba Log.",
    },

    // ---- Rotina semanal ----
    {
      section: "semanal",
      label: "Comparar com a semana anterior",
      detail: "Gasto, conversas e custo/conversa.",
    },
    {
      section: "semanal",
      label: "Conferir frequência",
      detail: "Passou de 3,5 → público saturando → trocar criativo ou ampliar público.",
    },
    {
      section: "semanal",
      label: "Conferir CTR",
      detail: "Abaixo de ~0,8% → criativo fraco → testar outro vídeo/gancho.",
    },
    {
      section: "semanal",
      label: "Print do resumo da semana",
      detail: "Alimenta o relatório mensal do cliente.",
    },
    {
      section: "semanal",
      label: "Perguntar quais leads viraram visita",
      detail: "Atualizar a etapa de cada lead na aba Leads.",
    },
    {
      section: "semanal",
      label: "Confirmar o imóvel prioritário",
      detail: '"O que você quer vender primeiro a gente alavanca mais."',
    },
  ];
}

// ---------------------------------------------------------------------------
// Referência (não é tarefa — é doutrina)
// ---------------------------------------------------------------------------

export const DECISION_RULES: { title: string; tone: "hold" | "stop" | "grow" | "swap"; items: string[] }[] = [
  {
    title: "NÃO mexer",
    tone: "hold",
    items: [
      "Campanha nova fica 4–7 dias sem NENHUMA edição — cada mudança de verba/público/criativo reinicia o aprendizado do algoritmo.",
      "Não pausar por 1 dia ruim. Avaliar sempre janela de 3–4 dias.",
    ],
  },
  {
    title: "PAUSAR anúncio/criativo",
    tone: "stop",
    items: [
      "Gastou ~3 dias de verba e deu zero conversa.",
      "Entrega geográfica fora do alvo — pausa imediata, esse é grave.",
      "Frequência > 4 com custo subindo.",
    ],
  },
  {
    title: "ESCALAR verba",
    tone: "grow",
    items: [
      "Custo/conversa estável ou caindo por 4+ dias seguidos.",
      "Aumentar +20% por vez, esperar 3–4 dias, repetir. NUNCA dobrar de uma vez.",
    ],
  },
  {
    title: "TROCAR criativo",
    tone: "swap",
    items: ["CTR < 0,8% depois de ~3 dias.", "Frequência > 3,5 com resultado caindo."],
  },
];

export const RED_FLAGS: { signal: string; meaning: string; action: string }[] = [
  {
    signal: "Entrega fora das praças-alvo",
    meaning: "Segmentação errada ou objetivo errado",
    action: "Pausar e revisar no mesmo dia",
  },
  {
    signal: "Milhares de views, zero conversa",
    meaning: "Campanha otimizando pra view, não pra conversa",
    action: "Conferir o objetivo da campanha (tem que ser Conversas)",
  },
  {
    signal: "Curtidas em massa de perfis estranhos",
    meaning: "Entrega em público-lixo",
    action: "Ver detalhamento por região",
  },
  {
    signal: "Custo/conversa dobrou de repente",
    meaning: "Criativo fadigado ou leilão mais caro",
    action: "Janela de 3–4 dias; se persistir, trocar criativo",
  },
  { signal: "Gasto zerado", meaning: "Pagamento recusado ou anúncio rejeitado", action: "Resolver no dia" },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Impressões", def: "Quantas vezes o anúncio apareceu." },
  { term: "Alcance", def: "Pra quantas pessoas diferentes apareceu." },
  { term: "CPM", def: "Custo por 1.000 impressões. Informativo, não é meta." },
  { term: "CTR", def: "% de quem viu e clicou — mede se o criativo prende. Alvo: acima de 0,8%." },
  {
    term: "Conversas iniciadas",
    def: "Gente que abriu o WhatsApp pelo anúncio. A métrica que importa.",
  },
  { term: "Custo por conversa", def: "Gasto ÷ conversas. O número que você gerencia." },
  { term: "Frequência", def: "Média de vezes que a mesma pessoa viu. Acima de 3,5 = saturação." },
  { term: "Aprendizado", def: "Primeiros dias em que o algoritmo testa entregas. Não mexer." },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Segunda-feira da semana de uma data YYYY-MM-DD (sem depender de fuso). */
export function weekStartISO(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0 = domingo
  const diff = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

/** Soma dias a uma data YYYY-MM-DD (aritmética em UTC, sem drift de fuso). */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Agrega gasto/conversas de um intervalo fechado [from, to] de datas ISO. */
export function aggregate(
  logs: { date: string; spendBrl: number | null; conversations: number | null }[],
  from: string,
  to: string,
) {
  const slice = logs.filter((l) => l.date >= from && l.date <= to);
  const spend = slice.reduce((s, l) => s + (l.spendBrl ?? 0), 0);
  const conversations = slice.reduce((s, l) => s + (l.conversations ?? 0), 0);
  return {
    days: slice.length,
    spend,
    conversations,
    cost: conversations > 0 ? spend / conversations : null,
  };
}

/** Custo por conversa. Null quando não dá pra calcular (sem gasto ou sem conversa). */
export function costPerConversation(
  spendBrl: number | null,
  conversations: number | null,
): number | null {
  if (spendBrl == null || conversations == null || conversations <= 0) return null;
  return spendBrl / conversations;
}

export function brl(value: number | null | undefined, digits = 2): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Faixa de comissão do acordo: até R$ 1M = 5%, acima = 10%. */
export function commissionTier(priceBrl: number | null | undefined): number | null {
  if (priceBrl == null) return null;
  return priceBrl > 1_000_000 ? 10 : 5;
}

/** dd/MM a partir de YYYY-MM-DD, sem passar por Date (evita drift de fuso). */
export function shortDate(dateISO: string): string {
  const [, m, d] = dateISO.split("-");
  return `${d}/${m}`;
}
