"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { todayISO } from "@/lib/utils";
import type { MuscleGroup } from "@/lib/gym";
import {
  addWorkoutExercise,
  createWorkout,
  deleteGymSession,
  deleteWorkout,
  logSet,
  removeWorkoutExercise,
  seedProgramIfEmpty,
  startSession,
  updateGymSession,
  updateWorkout,
  updateWorkoutExercise,
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
 * Salva todas as séries de um exercício de uma vez. O form manda
 * weight-1/reps-1, weight-2/reps-2... — um par por série.
 */
export async function logExerciseSetsAction(formData: FormData) {
  const s = await requireSession();
  const sessionId = str(formData, "sessionId");
  const exerciseId = str(formData, "exerciseId");
  const setCount = num(formData, "setCount") ?? 0;
  if (!sessionId || !exerciseId) return;

  for (let i = 1; i <= setCount; i++) {
    logSet({
      profileId: s.profile.id,
      sessionId,
      exerciseId,
      setNumber: i,
      weightKg: num(formData, `weight-${i}`),
      reps: num(formData, `reps-${i}`),
    });
  }

  revalidatePath(`/academia/sessao/${sessionId}`);
}

/** Aplica a carga sugerida no template, pra próxima sessão já vir com ela. */
export async function bumpTargetWeightAction(formData: FormData) {
  const s = await requireSession();
  const workoutExerciseId = str(formData, "workoutExerciseId");
  const sessionId = str(formData, "sessionId");
  const weight = num(formData, "weight");
  if (!workoutExerciseId || weight == null) return;
  updateWorkoutExercise({
    profileId: s.profile.id,
    workoutExerciseId,
    targetWeightKg: weight,
  });
  if (sessionId) revalidatePath(`/academia/sessao/${sessionId}`);
  revalidatePath("/academia");
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

// ── Treinos ─────────────────────────────────────────────────────────────────

export async function seedProgramAction() {
  const s = await requireSession();
  seedProgramIfEmpty(s.profile.id);
  revalidatePath("/academia");
}

export async function createWorkoutAction(formData: FormData) {
  const s = await requireSession();
  const name = str(formData, "name");
  if (!name) return;
  const weekday = num(formData, "weekday");
  const workout = createWorkout({ profileId: s.profile.id, name, weekday });
  revalidatePath("/academia");
  redirect(`/academia/treino/${workout.id}`);
}

export async function updateWorkoutAction(formData: FormData) {
  const s = await requireSession();
  const workoutId = str(formData, "workoutId");
  if (!workoutId) return;
  const weekdayRaw = str(formData, "weekday");
  updateWorkout({
    profileId: s.profile.id,
    workoutId,
    name: str(formData, "name") || undefined,
    weekday: weekdayRaw === "" ? null : Number(weekdayRaw),
  });
  revalidatePath(`/academia/treino/${workoutId}`);
  revalidatePath("/academia");
}

export async function deleteWorkoutAction(formData: FormData) {
  const s = await requireSession();
  const workoutId = str(formData, "id");
  if (!workoutId) return;
  deleteWorkout({ profileId: s.profile.id, workoutId });
  revalidatePath("/academia");
  redirect("/academia");
}

export async function addWorkoutExerciseAction(formData: FormData) {
  const s = await requireSession();
  const workoutId = str(formData, "workoutId");
  const name = str(formData, "name");
  if (!workoutId || !name) return;
  addWorkoutExercise({
    profileId: s.profile.id,
    workoutId,
    name,
    group: (str(formData, "group") || "outro") as MuscleGroup,
    sets: num(formData, "sets") ?? 3,
    repMin: num(formData, "repMin") ?? 8,
    repMax: num(formData, "repMax") ?? 12,
  });
  revalidatePath(`/academia/treino/${workoutId}`);
}

export async function updateWorkoutExerciseAction(formData: FormData) {
  const s = await requireSession();
  const workoutExerciseId = str(formData, "workoutExerciseId");
  const workoutId = str(formData, "workoutId");
  if (!workoutExerciseId) return;
  updateWorkoutExercise({
    profileId: s.profile.id,
    workoutExerciseId,
    sets: num(formData, "sets") ?? undefined,
    repMin: num(formData, "repMin") ?? undefined,
    repMax: num(formData, "repMax") ?? undefined,
    targetWeightKg: num(formData, "targetWeightKg"),
  });
  if (workoutId) revalidatePath(`/academia/treino/${workoutId}`);
}

export async function removeWorkoutExerciseAction(formData: FormData) {
  const s = await requireSession();
  const workoutExerciseId = str(formData, "id");
  const workoutId = str(formData, "workoutId");
  if (!workoutExerciseId) return;
  removeWorkoutExercise({ profileId: s.profile.id, workoutExerciseId });
  if (workoutId) revalidatePath(`/academia/treino/${workoutId}`);
}
