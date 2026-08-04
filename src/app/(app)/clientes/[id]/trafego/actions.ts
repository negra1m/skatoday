"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ownsClient } from "@/db/projects";
import {
  addChecklistItem,
  addLead,
  archiveChecklistItem,
  createCampaign,
  deleteCampaign,
  deleteDailyLog,
  deleteLead,
  getCampaignOwned,
  setCheck,
  updateCampaign,
  updateChecklistItem,
  updateLead,
  upsertDailyLog,
} from "@/db/traffic";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import type { NewTrafficLead, TrafficCampaign } from "@/db/schema";
import type { ChecklistSection } from "@/lib/traffic";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthorized");
  if (user.role !== "admin") throw new Error("forbidden");
  return user;
}

/** Garante que a campanha pertence a um cliente do admin logado. */
async function requireCampaign(campaignId: string) {
  const user = await requireAdmin();
  const owned = getCampaignOwned(user.id, campaignId);
  if (!owned) throw new Error("forbidden");
  return owned;
}

function revalidateCampaign(clientId: string, campaignId: string) {
  revalidatePath(`/clientes/${clientId}/trafego/${campaignId}`);
  revalidatePath(`/clientes/${clientId}/trafego`);
}

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function int(formData: FormData, key: string): number | null {
  const n = num(formData, key);
  return n == null ? null : Math.round(n);
}

function str(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

// ---- Campanha ----

export async function createCampaignAction(formData: FormData) {
  const user = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!clientId || !name) return;
  if (!ownsClient(user.id, clientId)) throw new Error("forbidden");

  const client = db
    .select({ name: schema.clients.name })
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId))
    .get();
  if (!client) throw new Error("not found");

  const campaign = createCampaign({
    clientId,
    clientName: client.name,
    name,
    propertyRef: str(formData, "propertyRef"),
    propertyUrl: str(formData, "propertyUrl"),
    priceBrl: num(formData, "priceBrl"),
    dailyBudgetBrl: num(formData, "dailyBudgetBrl"),
    monthlyBudgetBrl: num(formData, "monthlyBudgetBrl"),
    commissionPct: num(formData, "commissionPct"),
    objective: str(formData, "objective"),
    status: (str(formData, "status") as TrafficCampaign["status"]) ?? "planejando",
    startedAt: str(formData, "startedAt"),
    notes: str(formData, "notes"),
  });

  revalidatePath(`/clientes/${clientId}/trafego`);
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}/trafego/${campaign.id}`);
}

export async function updateCampaignAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  if (!campaignId) return;
  const { campaign } = await requireCampaign(campaignId);

  updateCampaign({
    campaignId,
    name: String(formData.get("name") ?? "").trim() || undefined,
    propertyRef: formData.has("propertyRef") ? str(formData, "propertyRef") : undefined,
    propertyUrl: formData.has("propertyUrl") ? str(formData, "propertyUrl") : undefined,
    priceBrl: formData.has("priceBrl") ? num(formData, "priceBrl") : undefined,
    dailyBudgetBrl: formData.has("dailyBudgetBrl") ? num(formData, "dailyBudgetBrl") : undefined,
    monthlyBudgetBrl: formData.has("monthlyBudgetBrl") ? num(formData, "monthlyBudgetBrl") : undefined,
    commissionPct: formData.has("commissionPct") ? num(formData, "commissionPct") : undefined,
    objective: formData.has("objective") ? str(formData, "objective") : undefined,
    status: (str(formData, "status") as TrafficCampaign["status"]) ?? undefined,
    startedAt: formData.has("startedAt") ? str(formData, "startedAt") : undefined,
    notes: formData.has("notes") ? str(formData, "notes") : undefined,
  });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function deleteCampaignAction(formData: FormData) {
  const campaignId = String(formData.get("id") ?? "");
  if (!campaignId) return;
  const { campaign } = await requireCampaign(campaignId);
  deleteCampaign(campaignId);
  revalidatePath(`/clientes/${campaign.clientId}/trafego`);
  revalidatePath(`/clientes/${campaign.clientId}`);
  redirect(`/clientes/${campaign.clientId}/trafego`);
}

// ---- Checklist ----

export async function toggleCheckAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const period = String(formData.get("period") ?? "");
  if (!campaignId || !itemId || !period) return;
  const { campaign } = await requireCampaign(campaignId);
  setCheck({ campaignId, itemId, period, done: String(formData.get("done")) === "1" });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function addChecklistItemAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const section = String(formData.get("section") ?? "") as ChecklistSection;
  const label = String(formData.get("label") ?? "").trim();
  if (!campaignId || !label) return;
  if (!["setup", "diaria", "semanal"].includes(section)) return;
  const { campaign } = await requireCampaign(campaignId);
  addChecklistItem({ campaignId, section, label, detail: str(formData, "detail") });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function updateChecklistItemAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!campaignId || !itemId || !label) return;
  const { campaign } = await requireCampaign(campaignId);
  updateChecklistItem({ itemId, campaignId, label, detail: str(formData, "detail") });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function deleteChecklistItemAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const itemId = String(formData.get("id") ?? "");
  if (!campaignId || !itemId) return;
  const { campaign } = await requireCampaign(campaignId);
  archiveChecklistItem({ itemId, campaignId });
  revalidateCampaign(campaign.clientId, campaignId);
}

// ---- Log diário ----

export async function saveDailyLogAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const date = String(formData.get("date") ?? "").trim();
  if (!campaignId || !date) return;
  const { campaign } = await requireCampaign(campaignId);
  upsertDailyLog({
    campaignId,
    date,
    spendBrl: num(formData, "spendBrl"),
    conversations: int(formData, "conversations"),
    notes: str(formData, "notes"),
  });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function deleteDailyLogAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const logId = String(formData.get("id") ?? "");
  if (!campaignId || !logId) return;
  const { campaign } = await requireCampaign(campaignId);
  deleteDailyLog({ campaignId, logId });
  revalidateCampaign(campaign.clientId, campaignId);
}

// ---- Leads ----

export async function addLeadAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  if (!campaignId || !name || !date) return;
  const { campaign } = await requireCampaign(campaignId);
  addLead({
    campaignId,
    date,
    name,
    phone: str(formData, "phone"),
    sourceRef: str(formData, "sourceRef"),
    stage: (str(formData, "stage") as NewTrafficLead["stage"]) ?? "novo",
    notes: str(formData, "notes"),
  });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function updateLeadAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  if (!campaignId || !leadId) return;
  const { campaign } = await requireCampaign(campaignId);
  updateLead({
    campaignId,
    leadId,
    stage: (str(formData, "stage") as NewTrafficLead["stage"]) ?? undefined,
    registeredInCrm: formData.has("registeredInCrm")
      ? String(formData.get("registeredInCrm")) === "1"
      : undefined,
    notes: formData.has("notes") ? str(formData, "notes") : undefined,
  });
  revalidateCampaign(campaign.clientId, campaignId);
}

export async function deleteLeadAction(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "");
  const leadId = String(formData.get("id") ?? "");
  if (!campaignId || !leadId) return;
  const { campaign } = await requireCampaign(campaignId);
  deleteLead({ campaignId, leadId });
  revalidateCampaign(campaign.clientId, campaignId);
}
