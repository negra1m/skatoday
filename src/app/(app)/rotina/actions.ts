"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { createRoutineItem, deleteRoutineItem, updateRoutineItem } from "@/db/routine";
import { toggleRoutine } from "@/db/mutations";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

export async function createRoutineItemAction(formData: FormData) {
  const s = await requireSession();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  try {
    createRoutineItem({ userId: s.user.id, label });
  } catch {
    // ignore (label vazio ou duplicado)
  }
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function updateRoutineItemAction(formData: FormData) {
  const s = await requireSession();
  const itemId = String(formData.get("id") ?? "");
  if (!itemId) return;
  updateRoutineItem({
    userId: s.user.id,
    itemId,
    label: (formData.get("label") as string)?.trim() || undefined,
  });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function deleteRoutineItemAction(formData: FormData) {
  const s = await requireSession();
  const itemId = String(formData.get("id") ?? "");
  if (!itemId) return;
  deleteRoutineItem({ userId: s.user.id, itemId });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export async function toggleRoutineAction(formData: FormData) {
  const s = await requireSession();
  const date = String(formData.get("date"));
  const taskKey = String(formData.get("taskKey"));
  const done = formData.get("done") === "1";
  toggleRoutine({ profileId: s.profile.id, date, taskKey, done });
  revalidatePath("/rotina");
  revalidatePath("/");
}
