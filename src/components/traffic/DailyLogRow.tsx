"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SwipeCard } from "@/components/ui/swipe-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { invokeAction } from "@/lib/form-action";
import { brl, costPerConversation, shortDate } from "@/lib/traffic";
import { cn } from "@/lib/utils";

type Action = (formData: FormData) => Promise<void>;

export type DailyLogView = {
  id: string;
  date: string;
  spendBrl: number | null;
  conversations: number | null;
  notes: string | null;
};

export function DailyLogRow({
  campaignId,
  log,
  /** Média histórica de custo/conversa — usada só pra sinalizar alta de 50%+. */
  avgCost,
  saveAction,
  deleteAction,
}: {
  campaignId: string;
  log: DailyLogView;
  avgCost: number | null;
  saveAction: Action;
  deleteAction: Action;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const cost = costPerConversation(log.spendBrl, log.conversations);

  const zeroSpend = log.spendBrl != null && log.spendBrl === 0;
  const zeroConv = (log.conversations ?? 0) === 0 && (log.spendBrl ?? 0) > 0;
  const costSpike = cost != null && avgCost != null && avgCost > 0 && cost > avgCost * 1.5;
  const alert = zeroSpend || zeroConv || costSpike;

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await saveAction(fd);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-primary/40 bg-muted/30 p-3"
      >
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="date" value={log.date} />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{log.date}</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="spendBrl"
            inputMode="decimal"
            placeholder="Gasto"
            defaultValue={log.spendBrl ?? ""}
          />
          <Input
            name="conversations"
            inputMode="numeric"
            placeholder="Conversas"
            defaultValue={log.conversations ?? ""}
          />
        </div>
        <Textarea name="notes" rows={2} placeholder="Observação" defaultValue={log.notes ?? ""} />
        <div className="flex gap-2">
          <SubmitButton size="sm" className="flex-1" pendingLabel="Salvando...">
            Salvar
          </SubmitButton>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <SwipeCard
      actions={[
        { type: "edit", onClick: () => setEditing(true) },
        {
          type: "delete",
          tone: "danger",
          confirmMessage: `Deletar o log de ${log.date}?`,
          onClick: async () => {
            await invokeAction(deleteAction, { id: log.id, campaignId });
            router.refresh();
          },
        },
      ]}
    >
      <div
        className={cn(
          "border border-border px-3 py-2.5",
          alert ? "border-l-2 border-l-red-500 bg-card" : "bg-card",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-hud text-sm">{shortDate(log.date)}</span>
          <div className="flex items-baseline gap-3 text-xs">
            <span className="text-muted-foreground">{brl(log.spendBrl)}</span>
            <span className="text-foreground">
              {log.conversations ?? "—"}
              <span className="text-muted-foreground"> conv</span>
            </span>
            <span className={cn("font-medium", costSpike ? "text-red-400" : "text-foreground")}>
              {cost == null ? "—" : brl(cost)}
            </span>
          </div>
        </div>
        {log.notes && (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{log.notes}</p>
        )}
        {alert && (
          <p className="mt-1 text-[10px] uppercase tracking-widest text-red-400">
            {zeroSpend
              ? "gasto zerado — resolver hoje"
              : zeroConv
                ? "gastou e não converteu"
                : "custo/conversa 50%+ acima da média"}
          </p>
        )}
      </div>
    </SwipeCard>
  );
}
