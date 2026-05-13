export const ROUTINE_TASKS = [
  { key: "dogs", label: "Dogs" },
  { key: "louca", label: "Louça" },
  { key: "varrer", label: "Varrer" },
  { key: "skate", label: "Skate" },
  { key: "corrida", label: "Corrida" },
  { key: "banho", label: "Banho" },
  { key: "comida", label: "Comida" },
  { key: "few", label: "Few/iFIGHT" },
] as const;

export type RoutineTaskKey = (typeof ROUTINE_TASKS)[number]["key"];
