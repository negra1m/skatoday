import { cn } from "@/lib/utils";
import { FLOW_LABEL, FLOW_STATES, type FlowState } from "@/lib/flow";

export function FlowGauge({ state }: { state: FlowState | null }) {
  return (
    <div className="flex items-center gap-1">
      {FLOW_STATES.map((s, i) => {
        const active = state === s;
        const reached = state ? FLOW_STATES.indexOf(state) >= i : false;
        return (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              reached ? "bg-foreground" : "bg-muted",
              active && "ring-2 ring-foreground/40",
            )}
          />
        );
      })}
      {state && (
        <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
          {FLOW_LABEL[state]}
        </span>
      )}
    </div>
  );
}
