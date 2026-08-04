"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TrafficTab = {
  key: string;
  label: string;
  badge?: string;
  content: React.ReactNode;
};

/**
 * Abas da operação de tráfego. Os conteúdos chegam já renderizados pelo
 * server component, então trocar de aba não faz round-trip.
 */
export function TrafficTabs({ tabs, defaultKey }: { tabs: TrafficTab[]; defaultKey?: string }) {
  const [active, setActive] = React.useState(defaultKey ?? tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
        >
          {tabs.map((t) => {
            const isActive = current?.key === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  isActive ? "bg-background text-foreground shadow" : "hover:text-foreground",
                )}
              >
                {t.label}
                {t.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[9px] tabular-nums",
                      isActive ? "bg-muted text-muted-foreground" : "bg-background/60",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((t) => (
        <div key={t.key} hidden={current?.key !== t.key}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
