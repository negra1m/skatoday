"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SwipeCard } from "@/components/ui/swipe-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { invokeAction } from "@/lib/form-action";
import { cn } from "@/lib/utils";

export type ChecklistItemView = {
  id: string;
  label: string;
  detail: string | null;
};

type Action = (formData: FormData) => Promise<void>;

type Props = {
  campaignId: string;
  section: "setup" | "diaria" | "semanal";
  title: string;
  hint: string;
  /** "once" | "YYYY-MM-DD" (dia) | "YYYY-MM-DD" (segunda da semana) */
  period: string;
  periodLabel: string;
  items: ChecklistItemView[];
  done: Record<string, boolean>;
  toggleAction: Action;
  addAction: Action;
  updateAction: Action;
  deleteAction: Action;
};

export function ChecklistBlock({
  campaignId,
  section,
  title,
  hint,
  period,
  periodLabel,
  items,
  done,
  toggleAction,
  addAction,
  updateAction,
  deleteAction,
}: Props) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const completed = items.filter((i) => done[i.id]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-hud text-sm font-semibold uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
        <div className="text-right">
          <p className="text-hud text-lg leading-none">
            {completed}
            <span className="text-sm text-muted-foreground">/{items.length}</span>
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{periodLabel}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum item nessa lista.</p>
        )}

        {items.map((item) => {
          const isDone = done[item.id] ?? false;
          if (editingId === item.id) {
            return (
              <EditForm
                key={item.id}
                campaignId={campaignId}
                item={item}
                action={updateAction}
                onDone={() => setEditingId(null)}
              />
            );
          }
          return (
            <ItemRow
              key={item.id}
              campaignId={campaignId}
              item={item}
              isDone={isDone}
              period={period}
              toggleAction={toggleAction}
              deleteAction={deleteAction}
              onEdit={() => setEditingId(item.id)}
            />
          );
        })}
      </div>

      {adding ? (
        <form
          action={async (fd) => {
            await addAction(fd);
            setAdding(false);
          }}
          className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="section" value={section} />
          <Input name="label" placeholder="O que fazer" required maxLength={120} autoFocus />
          <Textarea name="detail" placeholder="Detalhe (opcional)" rows={2} maxLength={400} />
          <div className="flex gap-2">
            <SubmitButton size="sm" className="flex-1" pendingLabel="Salvando...">
              Adicionar
            </SubmitButton>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Item
        </button>
      )}
    </div>
  );
}

function ItemRow({
  campaignId,
  item,
  isDone,
  period,
  toggleAction,
  deleteAction,
  onEdit,
}: {
  campaignId: string;
  item: ChecklistItemView;
  isDone: boolean;
  period: string;
  toggleAction: Action;
  deleteAction: Action;
  onEdit: () => void;
}) {
  const router = useRouter();
  return (
    <SwipeCard
      actions={[
        { type: "edit", onClick: onEdit },
        {
          type: "delete",
          tone: "danger",
          confirmMessage: `Remover "${item.label}" do checklist? O histórico de marcações é preservado.`,
          onClick: async () => {
            await invokeAction(deleteAction, { id: item.id, campaignId });
            router.refresh();
          },
        },
      ]}
    >
      <form action={toggleAction}>
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="period" value={period} />
        <input type="hidden" name="done" value={isDone ? "0" : "1"} />
        <button
          type="submit"
          className={cn(
            "flex w-full items-start gap-3 border border-border px-3 py-3 text-left transition-colors hover:bg-muted/40",
            isDone ? "bg-muted/50" : "bg-card",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
              isDone ? "border-primary bg-primary text-primary-foreground" : "border-input bg-secondary",
            )}
          >
            {isDone ? "✓" : ""}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-sm",
                isDone ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {item.label}
            </span>
            {item.detail && (
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                {item.detail}
              </span>
            )}
          </span>
        </button>
      </form>
    </SwipeCard>
  );
}

function EditForm({
  campaignId,
  item,
  action,
  onDone,
}: {
  campaignId: string;
  item: ChecklistItemView;
  action: Action;
  onDone: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone();
      }}
      className="space-y-2 rounded-md border border-primary/40 bg-muted/30 p-3"
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="itemId" value={item.id} />
      <Input name="label" defaultValue={item.label} required maxLength={120} autoFocus />
      <Textarea name="detail" defaultValue={item.detail ?? ""} rows={2} maxLength={400} />
      <div className="flex gap-2">
        <SubmitButton size="sm" className="flex-1" pendingLabel="Salvando...">
          Salvar
        </SubmitButton>
        <Button type="button" size="sm" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
