"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { SwipeCard } from "@/components/ui/swipe-card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { invokeAction } from "@/lib/form-action";
import { LEAD_STAGES, LEAD_STAGE_COLOR, LEAD_STAGE_LABEL, shortDate } from "@/lib/traffic";
import { cn } from "@/lib/utils";

type Action = (formData: FormData) => Promise<void>;

export type LeadView = {
  id: string;
  date: string;
  name: string;
  phone: string | null;
  sourceRef: string | null;
  stage: string;
  registeredInCrm: boolean;
  notes: string | null;
};

export function LeadRow({
  campaignId,
  lead,
  updateAction,
  deleteAction,
}: {
  campaignId: string;
  lead: LeadView;
  updateAction: Action;
  deleteAction: Action;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const stageFormRef = React.useRef<HTMLFormElement>(null);
  const crmFormRef = React.useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateAction(fd);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-primary/40 bg-muted/30 p-3"
      >
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="leadId" value={lead.id} />
        <p className="text-sm font-medium">{lead.name}</p>
        <Select name="stage" defaultValue={lead.stage}>
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STAGE_LABEL[s]}
            </option>
          ))}
        </Select>
        <Textarea name="notes" rows={3} placeholder="Observação" defaultValue={lead.notes ?? ""} />
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
          confirmMessage: `Deletar o lead "${lead.name}"?`,
          onClick: async () => {
            await invokeAction(deleteAction, { id: lead.id, campaignId });
            router.refresh();
          },
        },
      ]}
    >
      <div className="space-y-2 border border-border bg-card px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", LEAD_STAGE_COLOR[lead.stage])}
              />
              <p className="truncate text-sm font-medium">{lead.name}</p>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
              <span>{shortDate(lead.date)}</span>
              {lead.phone && (
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </a>
              )}
              {lead.sourceRef && <span className="truncate">· {lead.sourceRef}</span>}
            </div>
          </div>

          <form ref={stageFormRef} action={updateAction}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <Select
              name="stage"
              defaultValue={lead.stage}
              onChange={() => stageFormRef.current?.requestSubmit()}
              className="h-7 w-auto min-w-[104px] text-[11px]"
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STAGE_LABEL[s]}
                </option>
              ))}
            </Select>
          </form>
        </div>

        {lead.notes && (
          <p className="text-[11px] leading-snug text-muted-foreground">{lead.notes}</p>
        )}

        <form ref={crmFormRef} action={updateAction}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="registeredInCrm" value={lead.registeredInCrm ? "0" : "1"} />
          <button
            type="submit"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest transition-colors",
              lead.registeredInCrm
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/40 bg-amber-500/10 text-amber-400",
            )}
          >
            {lead.registeredInCrm ? "origem no CRM ✓" : "marcar origem no CRM"}
          </button>
        </form>
      </div>
    </SwipeCard>
  );
}
