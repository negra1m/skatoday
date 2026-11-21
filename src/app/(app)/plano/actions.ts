"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { getPerformancePhase, setPerformancePhase } from "@/db/plan";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

export async function advancePhaseAction() {
  const s = await requireSession();
  setPerformancePhase(s.profile.id, getPerformancePhase(s.profile.id) + 1);
  revalidatePath("/plano");
  revalidatePath("/");
  revalidatePath("/eu");
}

export async function regressPhaseAction() {
  const s = await requireSession();
  setPerformancePhase(s.profile.id, getPerformancePhase(s.profile.id) - 1);
  revalidatePath("/plano");
  revalidatePath("/");
  revalidatePath("/eu");
}
