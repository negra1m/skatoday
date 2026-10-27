"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { todayISO } from "@/lib/utils";
import {
  deleteGymSession,
  getProfileLevel,
  logSet,
  seedCalisthenicsProgram,
  setCalisthenicsLevel,
  startSession,
  updateGymSession,
} from "@/db/gym";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

/** Number ou null — campo em branco não vira 0. */
function num(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null) return null;
  const str = String(raw).trim().replace(",", ".");
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ── Programa ────────────────────────────────────────────────────────────────

export async function seedProgramAction() {
  const s = await requireSession();
  seedCalisthenicsProgram(s.profile.id);
  revalidatePath("/academia");
}

export async function levelUpAction() {
  const s = await requireSession();
  setCalisthenicsLevel(s.profile.id, getProfileLevel(s.profile.id) + 1);
  revalidatePath("/academia");
}

export async function levelDownAction() {
  const s = await requireSession();
  setCalisthenicsLevel(s.profile.id, getProfileLevel(s.profile.id) - 1);
  revalidatePath("/academia");
}

// ── Sessão ──────────────────────────────────────────────────────────────────

export async function startSessionAction(formData: FormData) {
  const s = await requireSession();
  const workoutId = str(formData, "workoutId") || null;
  const session = startSession({
    profileId: s.profile.id,
    date: todayISO(s.user.timezone),
    workoutId,
  });
  revalidatePath("/academia");
  redirect(`/academia/sessao/${session.id}`);
}

/**
 * Salva todas as séries de um exercício de uma vez. Cada série manda
 * val-i (reps OU segundos, conforme a unidade) e rpe-i. O campo `unit` diz
 * como interpretar o valor.
 */
export async function logExerciseSetsAction(formData: FormData) {
  const s = await requireSession();
  const sessionId = str(formData, "sessionId");
  const exerciseId = str(formData, "exerciseId");
  const unit = str(formData, "unit");
  const setCount = num(formData, "setCount") ?? 0;
  if (!sessionId || !exerciseId) return;

  for (let i = 1; i <= setCount; i++) {
    const value = num(formData, `val-${i}`);
    logSet({
      profileId: s.profile.id,
      sessionId,
      exerciseId,
      setNumber: i,
      reps: unit === "seg" ? null : value,
      seconds: unit === "seg" ? value : null,
      rpe: num(formData, `rpe-${i}`),
    });
  }

  revalidatePath(`/academia/sessao/${sessionId}`);
}

export async function finishSessionAction(formData: FormData) {
  const s = await requireSession();
  const sessionId = str(formData, "sessionId");
  if (!sessionId) return;
  updateGymSession({
    profileId: s.profile.id,
    sessionId,
    durationMinutes: num(formData, "durationMinutes"),
    notes: str(formData, "notes") || null,
  });
  revalidatePath("/academia");
  redirect("/academia");
}

export async function deleteGymSessionAction(formData: FormData) {
  const s = await requireSession();
  const sessionId = str(formData, "id");
  if (!sessionId) return;
  deleteGymSession({ profileId: s.profile.id, sessionId });
  revalidatePath("/academia");
}
