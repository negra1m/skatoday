"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { addGlass, ensureWaterConfig, getEffectiveGoalMl, getWaterConfig, removeGlass, updateWaterConfig } from "@/db/water";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

export async function addGlassAction() {
  const s = await requireSession();
  const cfg = ensureWaterConfig(s.profile.id);
  const goalMl = getEffectiveGoalMl(s.profile.id);
  addGlass(s.profile.id, cfg.glassSizeMl, goalMl);
  revalidatePath("/agua");
  revalidatePath("/eu");
  revalidatePath("/");
}

export async function removeGlassAction() {
  const s = await requireSession();
  const cfg = ensureWaterConfig(s.profile.id);
  removeGlass(s.profile.id, cfg.glassSizeMl);
  revalidatePath("/agua");
  revalidatePath("/eu");
  revalidatePath("/");
}

export async function updateWaterConfigAction(formData: FormData) {
  const s = await requireSession();
  const goalRaw = String(formData.get("goalMl") ?? "").trim();
  const goalMl = goalRaw === "" || goalRaw === "auto" ? null : Number(goalRaw);
  updateWaterConfig({
    profileId: s.profile.id,
    goalMl: Number.isFinite(goalMl as number) ? (goalMl as number) : null,
    glassSizeMl: Number(formData.get("glassSizeMl")) || undefined,
    wakeStart: (formData.get("wakeStart") as string) || undefined,
    wakeEnd: (formData.get("wakeEnd") as string) || undefined,
    notificationsEnabled: formData.get("notificationsEnabled") === "1",
    soundEnabled: formData.get("soundEnabled") === "1",
  });
  revalidatePath("/agua");
  revalidatePath("/eu");
}

export async function getCurrentWaterState() {
  const s = await requireSession();
  const cfg = ensureWaterConfig(s.profile.id);
  const goalMl = getEffectiveGoalMl(s.profile.id);
  const { getWaterLogForDate } = await import("@/db/water");
  const today = new Date().toISOString().slice(0, 10);
  const log = getWaterLogForDate(s.profile.id, today);
  return {
    goalMl,
    glassSizeMl: cfg.glassSizeMl,
    glassesDrunk: log?.glassesDrunk ?? 0,
    mlDrunk: log?.mlDrunk ?? 0,
    notificationsEnabled: cfg.notificationsEnabled,
    soundEnabled: cfg.soundEnabled,
    wakeStart: cfg.wakeStart,
    wakeEnd: cfg.wakeEnd,
  };
}
