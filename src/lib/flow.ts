export const FLOW_STATES = ["travado", "ok", "fluido", "absurdo"] as const;
export type FlowState = (typeof FLOW_STATES)[number];

export const FLOW_LABEL: Record<FlowState, string> = {
  travado: "Travado",
  ok: "Ok",
  fluido: "Fluido",
  absurdo: "Absurdo",
};

export const FLOW_HEX: Record<FlowState, string> = {
  travado: "#3f3f46",
  ok: "#71717a",
  fluido: "#e4e4e7",
  absurdo: "#ffffff",
};

export function flowIntensity(state: FlowState | null) {
  if (!state) return 0;
  return FLOW_STATES.indexOf(state) / (FLOW_STATES.length - 1);
}
