import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getClient } from "@/db/crm";
import { getCampaignOwned, listChecklistItems, listChecks, listDailyLogs, listLeads } from "@/db/traffic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { ChecklistBlock } from "@/components/traffic/ChecklistBlock";
import { DailyLogRow } from "@/components/traffic/DailyLogRow";
import { LeadRow } from "@/components/traffic/LeadRow";
import { TrafficTabs } from "@/components/traffic/TrafficTabs";
import {
  addDaysISO,
  aggregate,
  brl,
  CAMPAIGN_STATUS_COLOR,
  CAMPAIGN_STATUS_LABEL,
  commissionTier,
  costPerConversation,
  DECISION_RULES,
  GLOSSARY,
  LEAD_STAGES,
  LEAD_STAGE_LABEL,
  RED_FLAGS,
  SECTION_HINT,
  SECTION_LABEL,
  shortDate,
  weekStartISO,
} from "@/lib/traffic";
import { cn, todayISO } from "@/lib/utils";
import {
  addChecklistItemAction,
  addLeadAction,
  deleteCampaignAction,
  deleteChecklistItemAction,
  deleteDailyLogAction,
  deleteLeadAction,
  saveDailyLogAction,
  toggleCheckAction,
  updateCampaignAction,
  updateChecklistItemAction,
  updateLeadAction,
} from "../actions";

export default async function CampanhaPage({
  params,
}: {
  params: Promise<{ id: string; campanhaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  const { id, campanhaId } = await params;

  const owned = getCampaignOwned(user.id, campanhaId);
  if (!owned || owned.campaign.clientId !== id) notFound();
  const { campaign } = owned;
  const clientData = getClient(user.id, id);
  if (!clientData) notFound();
  const client = clientData.client;

  const today = todayISO(user.timezone);
  const thisWeek = weekStartISO(today);
  const lastWeek = addDaysISO(thisWeek, -7);

  const items = listChecklistItems(campaign.id);
  const checks = listChecks(campaign.id, ["once", today, thisWeek]);
  const checkMap = new Map(checks.map((c) => [`${c.itemId}|${c.period}`, c.done]));

  const logs = listDailyLogs(campaign.id, 120);
  const leads = listLeads(campaign.id);

  const sections = {
    setup: { period: "once", periodLabel: "uma vez" },
    diaria: { period: today, periodLabel: shortDate(today) },
    semanal: { period: thisWeek, periodLabel: `semana de ${shortDate(thisWeek)}` },
  } as const;

  function viewFor(section: "setup" | "diaria" | "semanal") {
    const { period } = sections[section];
    const list = items.filter((i) => i.section === section);
    const done: Record<string, boolean> = {};
    for (const i of list) done[i.id] = checkMap.get(`${i.id}|${period}`) ?? false;
    return {
      items: list.map((i) => ({ id: i.id, label: i.label, detail: i.detail })),
      done,
      pending: list.filter((i) => !done[i.id]).length,
    };
  }

  const setupView = viewFor("setup");
  const dailyView = viewFor("diaria");
  const weeklyView = viewFor("semanal");

  const todayLog = logs.find((l) => l.date === today) ?? null;
  const allTime = aggregate(logs, "0000-00-00", "9999-99-99");
  const week = aggregate(logs, thisWeek, today);
  const prevWeek = aggregate(logs, lastWeek, addDaysISO(thisWeek, -1));
  const last7 = aggregate(logs, addDaysISO(today, -6), today);
  const todayCost = costPerConversation(todayLog?.spendBrl ?? null, todayLog?.conversations ?? null);

  const stageCount = LEAD_STAGES.map((s) => ({
    stage: s,
    count: leads.filter((l) => l.stage === s).length,
  }));
  const tier = commissionTier(campaign.priceBrl);

  const tabs = [
    // -------------------------------------------------------------- HOJE
    {
      key: "hoje",
      label: "Hoje",
      badge: dailyView.pending > 0 ? String(dailyView.pending) : undefined,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Gasto hoje" value={brl(todayLog?.spendBrl ?? null, 0)} />
            <Metric label="Conversas" value={todayLog?.conversations?.toString() ?? "—"} />
            <Metric
              label="Custo/conv"
              value={brl(todayCost, 0)}
              alert={
                todayCost != null && allTime.cost != null && todayCost > allTime.cost * 1.5
              }
            />
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            média 7 dias: {brl(last7.cost, 0)} · média geral: {brl(allTime.cost, 0)}
          </p>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Log de {shortDate(today)}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveDailyLogAction} className="space-y-2">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="date" value={today} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="spendBrl">Gasto (R$)</Label>
                    <Input
                      id="spendBrl"
                      name="spendBrl"
                      inputMode="decimal"
                      placeholder={campaign.dailyBudgetBrl?.toString() ?? "0"}
                      defaultValue={todayLog?.spendBrl ?? ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="conversations">Conversas</Label>
                    <Input
                      id="conversations"
                      name="conversations"
                      inputMode="numeric"
                      placeholder="0"
                      defaultValue={todayLog?.conversations ?? ""}
                    />
                  </div>
                </div>
                <Textarea
                  name="notes"
                  rows={2}
                  placeholder="Observação do dia"
                  defaultValue={todayLog?.notes ?? ""}
                />
                <SubmitButton size="sm" className="w-full" pendingLabel="Salvando...">
                  {todayLog ? "Atualizar log de hoje" : "Lançar log de hoje"}
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <ChecklistBlock
            campaignId={campaign.id}
            section="diaria"
            title={SECTION_LABEL.diaria}
            hint={SECTION_HINT.diaria}
            period={sections.diaria.period}
            periodLabel={sections.diaria.periodLabel}
            items={dailyView.items}
            done={dailyView.done}
            toggleAction={toggleCheckAction}
            addAction={addChecklistItemAction}
            updateAction={updateChecklistItemAction}
            deleteAction={deleteChecklistItemAction}
          />

          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            <span className="text-foreground">Regra de ouro:</span> olhar todo dia, mexer quase
            nunca. Confira a aba Manual antes de editar qualquer coisa.
          </p>
        </div>
      ),
    },

    // ------------------------------------------------------------ SEMANA
    {
      key: "semana",
      label: "Semana",
      badge: weeklyView.pending > 0 ? String(weeklyView.pending) : undefined,
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Esta semana vs anterior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <CompareRow
                label="Gasto"
                current={brl(week.spend, 0)}
                previous={brl(prevWeek.spend, 0)}
                delta={delta(week.spend, prevWeek.spend)}
                goodWhen="neutral"
              />
              <CompareRow
                label="Conversas"
                current={String(week.conversations)}
                previous={String(prevWeek.conversations)}
                delta={delta(week.conversations, prevWeek.conversations)}
                goodWhen="up"
              />
              <CompareRow
                label="Custo/conversa"
                current={brl(week.cost, 0)}
                previous={brl(prevWeek.cost, 0)}
                delta={delta(week.cost, prevWeek.cost)}
                goodWhen="down"
              />
              <p className="pt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {week.days} dia(s) lançado(s) nesta semana
              </p>
            </CardContent>
          </Card>

          <ChecklistBlock
            campaignId={campaign.id}
            section="semanal"
            title={SECTION_LABEL.semanal}
            hint={SECTION_HINT.semanal}
            period={sections.semanal.period}
            periodLabel={sections.semanal.periodLabel}
            items={weeklyView.items}
            done={weeklyView.done}
            toggleAction={toggleCheckAction}
            addAction={addChecklistItemAction}
            updateAction={updateChecklistItemAction}
            deleteAction={deleteChecklistItemAction}
          />
        </div>
      ),
    },

    // ------------------------------------------------------------- SETUP
    {
      key: "setup",
      label: "Setup",
      badge: setupView.pending > 0 ? String(setupView.pending) : undefined,
      content: (
        <ChecklistBlock
          campaignId={campaign.id}
          section="setup"
          title={SECTION_LABEL.setup}
          hint={SECTION_HINT.setup}
          period={sections.setup.period}
          periodLabel={sections.setup.periodLabel}
          items={setupView.items}
          done={setupView.done}
          toggleAction={toggleCheckAction}
          addAction={addChecklistItemAction}
          updateAction={updateChecklistItemAction}
          deleteAction={deleteChecklistItemAction}
        />
      ),
    },

    // --------------------------------------------------------------- LOG
    {
      key: "log",
      label: "Log",
      badge: logs.length ? String(logs.length) : undefined,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Gasto total" value={brl(allTime.spend, 0)} />
            <Metric label="Conversas" value={String(allTime.conversations)} />
            <Metric label="Custo/conv" value={brl(allTime.cost, 0)} />
          </div>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum dia lançado ainda. Comece pela aba Hoje.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <DailyLogRow
                  key={l.id}
                  campaignId={campaign.id}
                  log={{
                    id: l.id,
                    date: l.date,
                    spendBrl: l.spendBrl,
                    conversations: l.conversations,
                    notes: l.notes,
                  }}
                  avgCost={allTime.cost}
                  saveAction={saveDailyLogAction}
                  deleteAction={deleteDailyLogAction}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },

    // ------------------------------------------------------------- LEADS
    {
      key: "leads",
      label: "Leads",
      badge: leads.length ? String(leads.length) : undefined,
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {stageCount.map(({ stage, count }) => (
              <span
                key={stage}
                className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {LEAD_STAGE_LABEL[stage]} · {count}
              </span>
            ))}
          </div>

          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            <span className="text-amber-400">Comissão depende disso.</span> Todo contato entra no
            MESMO DIA, com origem marcada no CRM do cliente. Sem registro desde o primeiro
            contato, não há como provar a origem.
            {tier != null && (
              <>
                {" "}
                Faixa deste imóvel: <span className="text-foreground">{tier}%</span> da comissão
                líquida.
              </>
            )}
          </p>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Novo lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addLeadAction} className="space-y-2">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <div className="grid grid-cols-2 gap-2">
                  <Input name="name" placeholder="Nome" required maxLength={80} />
                  <Input name="phone" inputMode="tel" placeholder="Telefone" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="date" type="date" defaultValue={today} required />
                  <Select name="stage" defaultValue="novo">
                    {LEAD_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STAGE_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  name="sourceRef"
                  placeholder="Campanha/imóvel de origem"
                  defaultValue={campaign.propertyRef ?? campaign.name}
                />
                <Textarea name="notes" rows={2} placeholder="Observação" />
                <SubmitButton size="sm" className="w-full" pendingLabel="Salvando...">
                  Registrar lead
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          {leads.length > 0 && (
            <div className="space-y-2">
              {leads.map((l) => (
                <LeadRow
                  key={l.id}
                  campaignId={campaign.id}
                  lead={{
                    id: l.id,
                    date: l.date,
                    name: l.name,
                    phone: l.phone,
                    sourceRef: l.sourceRef,
                    stage: l.stage,
                    registeredInCrm: l.registeredInCrm,
                    notes: l.notes,
                  }}
                  updateAction={updateLeadAction}
                  deleteAction={deleteLeadAction}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },

    // ------------------------------------------------------------ MANUAL
    {
      key: "manual",
      label: "Manual",
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quando mexer e quando não</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DECISION_RULES.map((r) => (
                <div key={r.title}>
                  <p
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-widest",
                      r.tone === "hold" && "text-blue-400",
                      r.tone === "stop" && "text-red-400",
                      r.tone === "grow" && "text-emerald-400",
                      r.tone === "swap" && "text-amber-400",
                    )}
                  >
                    {r.title}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {r.items.map((i) => (
                      <li key={i} className="text-[11px] leading-snug text-muted-foreground">
                        · {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Red flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RED_FLAGS.map((f) => (
                <div key={f.signal} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                  <p className="text-xs font-medium text-red-400">{f.signal}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{f.meaning}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-foreground">→ {f.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Glossário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {GLOSSARY.map((g) => (
                <p key={g.term} className="text-[11px] leading-snug text-muted-foreground">
                  <span className="text-foreground">{g.term}</span> — {g.def}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      ),
    },

    // ----------------------------------------------------------- AJUSTES
    {
      key: "ajustes",
      label: "Ajustes",
      content: (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dados da operação</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateCampaignAction} className="space-y-3">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <div className="space-y-1">
                <Label htmlFor="c-name">Nome</Label>
                <Input id="c-name" name="name" defaultValue={campaign.name} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-ref">Ref. imóvel</Label>
                  <Input id="c-ref" name="propertyRef" defaultValue={campaign.propertyRef ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-price">Valor (R$)</Label>
                  <Input
                    id="c-price"
                    name="priceBrl"
                    inputMode="decimal"
                    defaultValue={campaign.priceBrl ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-url">URL do imóvel</Label>
                <Input id="c-url" name="propertyUrl" defaultValue={campaign.propertyUrl ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-month">Verba/mês</Label>
                  <Input
                    id="c-month"
                    name="monthlyBudgetBrl"
                    inputMode="decimal"
                    defaultValue={campaign.monthlyBudgetBrl ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-day">Verba/dia</Label>
                  <Input
                    id="c-day"
                    name="dailyBudgetBrl"
                    inputMode="decimal"
                    defaultValue={campaign.dailyBudgetBrl ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-comm">Comissão (%)</Label>
                  <Input
                    id="c-comm"
                    name="commissionPct"
                    inputMode="decimal"
                    defaultValue={campaign.commissionPct ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-start">Início</Label>
                  <Input
                    id="c-start"
                    name="startedAt"
                    type="date"
                    defaultValue={campaign.startedAt ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-status">Status</Label>
                  <Select id="c-status" name="status" defaultValue={campaign.status}>
                    <option value="planejando">Planejando</option>
                    <option value="ativa">Ativa</option>
                    <option value="pausada">Pausada</option>
                    <option value="encerrada">Encerrada</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-obj">Objetivo</Label>
                  <Input id="c-obj" name="objective" defaultValue={campaign.objective ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-notes">Notas</Label>
                <Textarea id="c-notes" name="notes" rows={4} defaultValue={campaign.notes ?? ""} />
              </div>
              <SubmitButton className="w-full" pendingLabel="Salvando...">
                Salvar
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Link
        href={`/clientes/${client.id}/trafego`}
        className="text-[10px] uppercase tracking-widest text-muted-foreground"
      >
        ← Tráfego · {client.name}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", CAMPAIGN_STATUS_COLOR[campaign.status])}
            />
            <h1 className="text-hud truncate text-2xl font-semibold">{campaign.name}</h1>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[
              CAMPAIGN_STATUS_LABEL[campaign.status],
              campaign.propertyRef,
              campaign.priceBrl != null ? brl(campaign.priceBrl, 0) : null,
              campaign.dailyBudgetBrl != null ? `${brl(campaign.dailyBudgetBrl, 0)}/dia` : null,
              campaign.commissionPct != null ? `${campaign.commissionPct}% comissão` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {campaign.propertyUrl && (
            <a
              href={campaign.propertyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" /> anúncio do imóvel
            </a>
          )}
        </div>
        <DeleteButton
          action={deleteCampaignAction}
          id={campaign.id}
          message={`Deletar a operação "${campaign.name}" com checklist, logs e leads?`}
          size="md"
        />
      </div>

      <TrafficTabs tabs={tabs} />
    </div>
  );
}

function Metric({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-2 py-2 text-center",
        alert && "border-red-500/50",
      )}
    >
      <p className={cn("text-hud text-base leading-none", alert && "text-red-400")}>{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function delta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function CompareRow({
  label,
  current,
  previous,
  delta: pct,
  goodWhen,
}: {
  label: string;
  current: string;
  previous: string;
  delta: number | null;
  goodWhen: "up" | "down" | "neutral";
}) {
  const up = pct != null && pct > 0;
  const good =
    pct == null || goodWhen === "neutral" ? null : goodWhen === "up" ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-[11px] text-muted-foreground">{previous} →</span>
        <span className="text-foreground">{current}</span>
        {pct != null && Math.abs(pct) >= 1 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px]",
              good === null ? "text-muted-foreground" : good ? "text-emerald-400" : "text-red-400",
            )}
          >
            <Icon className="h-3 w-3" />
            {Math.abs(Math.round(pct))}%
          </span>
        )}
      </span>
    </div>
  );
}
