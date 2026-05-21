"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import {
  deleteBodyLog,
  deleteJiu,
  deleteRun,
  deleteSessionTrick,
  deleteSkateSession,
  deleteTrick,
  updateBodyLog,
  updateJiu,
  updateRun,
  updateSkateSession,
} from "@/db/mutations";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

const num = (v: FormDataEntryValue | null) => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function deleteBodyLogAction(formData: FormData) {
  const s = await requireSession();
  deleteBodyLog({ profileId: s.profile.id, bodyLogId: String(formData.get("id") ?? "") });
  revalidatePath("/corpo");
  revalidatePath("/eu");
  revalidatePath("/");
}

export async function deleteRunAction(formData: FormData) {
  const s = await requireSession();
  deleteRun({ profileId: s.profile.id, runId: String(formData.get("id") ?? "") });
  revalidatePath("/corrida");
  revalidatePath("/eu");
  revalidatePath("/");
}

export async function deleteJiuAction(formData: FormData) {
  const s = await requireSession();
  deleteJiu({ profileId: s.profile.id, jiuId: String(formData.get("id") ?? "") });
  revalidatePath("/jiu");
  revalidatePath("/eu");
  revalidatePath("/");
}

export async function deleteSkateSessionAction(formData: FormData) {
  const s = await requireSession();
  deleteSkateSession({ profileId: s.profile.id, sessionId: String(formData.get("id") ?? "") });
  revalidatePath("/skate/sessao");
  revalidatePath("/skate");
  revalidatePath("/");
}

export async function deleteSessionTrickAction(formData: FormData) {
  const s = await requireSession();
  deleteSessionTrick({ profileId: s.profile.id, sessionTrickId: String(formData.get("id") ?? "") });
  revalidatePath("/skate/sessao");
  revalidatePath("/skate");
}

export async function deleteTrickAction(formData: FormData) {
  const s = await requireSession();
  const trickId = String(formData.get("id") ?? "");
  if (!trickId) return;
  deleteTrick({ profileId: s.profile.id, trickId });
  revalidatePath("/skate");
  revalidatePath("/skate/sessao");
  revalidatePath("/");
  redirect("/skate");
}

export async function updateBodyLogAction(formData: FormData) {
  const s = await requireSession();
  updateBodyLog({
    profileId: s.profile.id,
    bodyLogId: String(formData.get("id") ?? ""),
    weightKg: num(formData.get("weightKg")),
    bodyFatPct: num(formData.get("bodyFatPct")),
    visceralFat: num(formData.get("visceralFat")),
    muscleMassKg: num(formData.get("muscleMassKg")),
    waterPct: num(formData.get("waterPct")),
    energy: num(formData.get("energy")),
    mood: num(formData.get("mood")),
    sleepHours: num(formData.get("sleepHours")),
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/corpo");
  redirect("/corpo");
}

export async function updateRunAction(formData: FormData) {
  const s = await requireSession();
  updateRun({
    profileId: s.profile.id,
    runId: String(formData.get("id") ?? ""),
    date: (formData.get("date") as string) || undefined,
    distanceKm: num(formData.get("distanceKm")) ?? undefined,
    durationMinutes: num(formData.get("durationMinutes")) ?? undefined,
    type: (formData.get("type") as "leve") || undefined,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/corrida");
  redirect("/corrida");
}

export async function updateJiuAction(formData: FormData) {
  const s = await requireSession();
  updateJiu({
    profileId: s.profile.id,
    jiuId: String(formData.get("id") ?? ""),
    date: (formData.get("date") as string) || undefined,
    durationMinutes: num(formData.get("durationMinutes")) ?? undefined,
    rolls: num(formData.get("rolls")) ?? undefined,
    intensity: num(formData.get("intensity")) ?? undefined,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/jiu");
  redirect("/jiu");
}

export async function updateSkateSessionAction(formData: FormData) {
  const s = await requireSession();
  updateSkateSession({
    profileId: s.profile.id,
    sessionId: String(formData.get("id") ?? ""),
    date: (formData.get("date") as string) || undefined,
    durationMinutes: num(formData.get("duration")),
    location: (formData.get("location") as string) || null,
    sessionType: (formData.get("session_type") as "flow") || null,
    feeling: num(formData.get("feeling")),
    confidence: num(formData.get("confidence")),
    pain: num(formData.get("pain")),
    flowState: (formData.get("flow_state") as "ok") || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/skate/sessao");
  redirect("/skate/sessao");
}
