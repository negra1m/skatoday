import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./client";
import type {
  NewTrafficLead,
  TrafficCampaign,
  TrafficCheck,
  TrafficChecklistItem,
  TrafficDailyLog,
  TrafficLead,
} from "./schema";
import { seedChecklist, type ChecklistSection } from "@/lib/traffic";

// ---- Ownership ----

/** Campanha + cliente, só se o cliente for do userId. Null se não for. */
export function getCampaignOwned(userId: string, campaignId: string) {
  const row = db
    .select({ campaign: schema.trafficCampaigns, clientName: schema.clients.name })
    .from(schema.trafficCampaigns)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.trafficCampaigns.clientId))
    .where(and(eq(schema.trafficCampaigns.id, campaignId), eq(schema.clients.userId, userId)))
    .get();
  return row ?? null;
}

export function ownsCampaign(userId: string, campaignId: string): boolean {
  return !!getCampaignOwned(userId, campaignId);
}

// ---- Campanhas ----

export function listCampaigns(clientId: string): TrafficCampaign[] {
  return db
    .select()
    .from(schema.trafficCampaigns)
    .where(eq(schema.trafficCampaigns.clientId, clientId))
    .orderBy(desc(schema.trafficCampaigns.createdAt))
    .all();
}

export function countCampaigns(clientId: string): number {
  return listCampaigns(clientId).length;
}

/** Cria a campanha já com o checklist semeado. */
export function createCampaign(input: {
  clientId: string;
  clientName: string;
  name: string;
  propertyRef?: string | null;
  propertyUrl?: string | null;
  priceBrl?: number | null;
  dailyBudgetBrl?: number | null;
  monthlyBudgetBrl?: number | null;
  commissionPct?: number | null;
  objective?: string | null;
  status?: TrafficCampaign["status"];
  startedAt?: string | null;
  notes?: string | null;
}): TrafficCampaign {
  const campaign = db
    .insert(schema.trafficCampaigns)
    .values({
      clientId: input.clientId,
      name: input.name.trim(),
      propertyRef: input.propertyRef ?? null,
      propertyUrl: input.propertyUrl ?? null,
      priceBrl: input.priceBrl ?? null,
      dailyBudgetBrl: input.dailyBudgetBrl ?? null,
      monthlyBudgetBrl: input.monthlyBudgetBrl ?? null,
      commissionPct: input.commissionPct ?? null,
      objective: input.objective ?? "Conversas no WhatsApp",
      status: input.status ?? "planejando",
      startedAt: input.startedAt ?? null,
      notes: input.notes ?? null,
    })
    .returning()
    .get();

  const seed = seedChecklist(input.clientName);
  const bySection: Record<string, number> = {};
  db.insert(schema.trafficChecklistItems)
    .values(
      seed.map((s) => {
        bySection[s.section] = (bySection[s.section] ?? 0) + 1;
        return {
          campaignId: campaign.id,
          section: s.section,
          label: s.label,
          detail: s.detail ?? null,
          sortOrder: bySection[s.section] * 10,
        };
      }),
    )
    .run();

  return campaign;
}

export function updateCampaign(input: {
  campaignId: string;
  name?: string;
  propertyRef?: string | null;
  propertyUrl?: string | null;
  priceBrl?: number | null;
  dailyBudgetBrl?: number | null;
  monthlyBudgetBrl?: number | null;
  commissionPct?: number | null;
  objective?: string | null;
  status?: TrafficCampaign["status"];
  startedAt?: string | null;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const keys = [
    "name",
    "propertyRef",
    "propertyUrl",
    "priceBrl",
    "dailyBudgetBrl",
    "monthlyBudgetBrl",
    "commissionPct",
    "objective",
    "status",
    "startedAt",
    "notes",
  ] as const;
  for (const k of keys) {
    const v = input[k];
    if (v !== undefined) patch[k] = typeof v === "string" && k === "name" ? v.trim() : v;
  }
  db.update(schema.trafficCampaigns)
    .set(patch)
    .where(eq(schema.trafficCampaigns.id, input.campaignId))
    .run();
}

export function deleteCampaign(campaignId: string) {
  db.delete(schema.trafficCampaigns).where(eq(schema.trafficCampaigns.id, campaignId)).run();
}

// ---- Checklist ----

export function listChecklistItems(campaignId: string): TrafficChecklistItem[] {
  return db
    .select()
    .from(schema.trafficChecklistItems)
    .where(eq(schema.trafficChecklistItems.campaignId, campaignId))
    .orderBy(asc(schema.trafficChecklistItems.sortOrder), asc(schema.trafficChecklistItems.createdAt))
    .all()
    .filter((i) => !i.archivedAt);
}

export function addChecklistItem(input: {
  campaignId: string;
  section: ChecklistSection;
  label: string;
  detail?: string | null;
}) {
  const siblings = db
    .select({ sortOrder: schema.trafficChecklistItems.sortOrder })
    .from(schema.trafficChecklistItems)
    .where(
      and(
        eq(schema.trafficChecklistItems.campaignId, input.campaignId),
        eq(schema.trafficChecklistItems.section, input.section),
      ),
    )
    .all();
  const next = siblings.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 10;
  return db
    .insert(schema.trafficChecklistItems)
    .values({
      campaignId: input.campaignId,
      section: input.section,
      label: input.label.trim(),
      detail: input.detail?.trim() || null,
      sortOrder: next,
    })
    .returning()
    .get();
}

export function updateChecklistItem(input: {
  itemId: string;
  campaignId: string;
  label?: string;
  detail?: string | null;
}) {
  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.detail !== undefined) patch.detail = input.detail?.trim() || null;
  if (Object.keys(patch).length === 0) return;
  db.update(schema.trafficChecklistItems)
    .set(patch)
    .where(
      and(
        eq(schema.trafficChecklistItems.id, input.itemId),
        eq(schema.trafficChecklistItems.campaignId, input.campaignId),
      ),
    )
    .run();
}

/** Arquiva (soft delete) — históricos de check continuam existindo. */
export function archiveChecklistItem(input: { itemId: string; campaignId: string }) {
  db.update(schema.trafficChecklistItems)
    .set({ archivedAt: new Date().toISOString() })
    .where(
      and(
        eq(schema.trafficChecklistItems.id, input.itemId),
        eq(schema.trafficChecklistItems.campaignId, input.campaignId),
      ),
    )
    .run();
}

/** Checks de uma campanha para os períodos informados ("once", dia, semana). */
export function listChecks(campaignId: string, periods: string[]): TrafficCheck[] {
  if (periods.length === 0) return [];
  return db
    .select()
    .from(schema.trafficChecks)
    .where(
      and(
        eq(schema.trafficChecks.campaignId, campaignId),
        inArray(schema.trafficChecks.period, periods),
      ),
    )
    .all();
}

export function setCheck(input: {
  campaignId: string;
  itemId: string;
  period: string;
  done: boolean;
}) {
  db.insert(schema.trafficChecks)
    .values({
      campaignId: input.campaignId,
      itemId: input.itemId,
      period: input.period,
      done: input.done,
    })
    .onConflictDoUpdate({
      target: [schema.trafficChecks.itemId, schema.trafficChecks.period],
      set: { done: input.done, updatedAt: new Date().toISOString() },
    })
    .run();
}

// ---- Log diário ----

export function listDailyLogs(campaignId: string, limit = 60): TrafficDailyLog[] {
  return db
    .select()
    .from(schema.trafficDailyLogs)
    .where(eq(schema.trafficDailyLogs.campaignId, campaignId))
    .orderBy(desc(schema.trafficDailyLogs.date))
    .limit(limit)
    .all();
}

export function upsertDailyLog(input: {
  campaignId: string;
  date: string;
  spendBrl: number | null;
  conversations: number | null;
  notes: string | null;
}) {
  db.insert(schema.trafficDailyLogs)
    .values({
      campaignId: input.campaignId,
      date: input.date,
      spendBrl: input.spendBrl,
      conversations: input.conversations,
      notes: input.notes,
    })
    .onConflictDoUpdate({
      target: [schema.trafficDailyLogs.campaignId, schema.trafficDailyLogs.date],
      set: {
        spendBrl: input.spendBrl,
        conversations: input.conversations,
        notes: input.notes,
        updatedAt: new Date().toISOString(),
      },
    })
    .run();
}

export function deleteDailyLog(input: { campaignId: string; logId: string }) {
  db.delete(schema.trafficDailyLogs)
    .where(
      and(
        eq(schema.trafficDailyLogs.id, input.logId),
        eq(schema.trafficDailyLogs.campaignId, input.campaignId),
      ),
    )
    .run();
}

// ---- Leads ----

export function listLeads(campaignId: string): TrafficLead[] {
  return db
    .select()
    .from(schema.trafficLeads)
    .where(eq(schema.trafficLeads.campaignId, campaignId))
    .orderBy(desc(schema.trafficLeads.date), desc(schema.trafficLeads.createdAt))
    .all();
}

export function addLead(input: {
  campaignId: string;
  date: string;
  name: string;
  phone?: string | null;
  sourceRef?: string | null;
  stage?: NewTrafficLead["stage"];
  notes?: string | null;
}) {
  return db
    .insert(schema.trafficLeads)
    .values({
      campaignId: input.campaignId,
      date: input.date,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      sourceRef: input.sourceRef?.trim() || null,
      stage: input.stage ?? "novo",
      notes: input.notes?.trim() || null,
    })
    .returning()
    .get();
}

export function updateLead(input: {
  campaignId: string;
  leadId: string;
  stage?: NewTrafficLead["stage"];
  registeredInCrm?: boolean;
  notes?: string | null;
}) {
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.stage !== undefined) patch.stage = input.stage;
  if (input.registeredInCrm !== undefined) patch.registeredInCrm = input.registeredInCrm;
  if (input.notes !== undefined) patch.notes = input.notes;
  db.update(schema.trafficLeads)
    .set(patch)
    .where(
      and(
        eq(schema.trafficLeads.id, input.leadId),
        eq(schema.trafficLeads.campaignId, input.campaignId),
      ),
    )
    .run();
}

export function deleteLead(input: { campaignId: string; leadId: string }) {
  db.delete(schema.trafficLeads)
    .where(
      and(
        eq(schema.trafficLeads.id, input.leadId),
        eq(schema.trafficLeads.campaignId, input.campaignId),
      ),
    )
    .run();
}
