"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FEW_PROJECTS, PRIORITIES, PRIORITY_LABEL } from "@/lib/projects";

export function TaskFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const project = params.get("project") ?? "";
  const priority = params.get("priority") ?? "";
  const search = params.get("q") ?? "";
  const showDone = params.get("done") === "1";

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
    router.push("/tarefas?" + next.toString());
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          defaultValue={search}
          onChange={(e) => {
            const v = e.currentTarget.value;
            window.clearTimeout((window as unknown as { __qTimer?: number }).__qTimer);
            (window as unknown as { __qTimer?: number }).__qTimer = window.setTimeout(
              () => setParam("q", v || null),
              250,
            );
          }}
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setParam("q", null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Todos" active={!project} onClick={() => setParam("project", null)} />
        {FEW_PROJECTS.map((p) => (
          <Chip key={p} label={p} active={project === p} onClick={() => setParam("project", p)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Todas" active={!priority} onClick={() => setParam("priority", null)} />
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={PRIORITY_LABEL[p]}
            active={priority === p}
            onClick={() => setParam("priority", p)}
          />
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => setParam("done", e.currentTarget.checked ? "1" : null)}
          className="h-3.5 w-3.5"
        />
        Mostrar concluídas
      </label>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
