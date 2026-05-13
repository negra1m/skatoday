// Ordem reflete prioridade Few. Os 5 primeiros são foco atual; o resto vem depois.
export const FEW_PROJECTS = [
  "iFIGHT",
  "Archradar",
  "AppResente",
  "Sentinel",
  "skatoday",
  "Sentinel PWA",
  "Sentinel Agent",
  "oAuth Few",
  "Email Manager",
  "Paulinho Poker",
  "LibreIC",
  "Pede Aqui!",
  "OndeTá",
  "ICAE",
  "INIEC",
] as const;

export type FewProject = (typeof FEW_PROJECTS)[number];

export const PRIORITIES = ["urgent", "next", "stable", "planned"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgente",
  next: "Próximo",
  stable: "Estável",
  planned: "Planejado",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  next: 1,
  stable: 2,
  planned: 3,
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "border-red-500/60 bg-red-500/10",
  next: "border-amber-500/60 bg-amber-500/10",
  stable: "border-emerald-500/60 bg-emerald-500/10",
  planned: "border-blue-500/60 bg-blue-500/10",
};

export const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-red-500",
  next: "bg-amber-500",
  stable: "bg-emerald-500",
  planned: "bg-blue-500",
};
