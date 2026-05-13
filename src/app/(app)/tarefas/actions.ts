"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { createTask, updateTask, toggleTaskDone, deleteTask } from "@/db/mutations";
import type { Priority } from "@/lib/projects";

export async function createTaskAction(formData: FormData) {
  const s = (await getCurrentSession())!;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  createTask({
    profileId: s.profile.id,
    title,
    project: String(formData.get("project") ?? "skatoday"),
    priority: (String(formData.get("priority") ?? "next") as Priority),
    deadline: (formData.get("deadline") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/tarefas");
  revalidatePath("/");
  revalidatePath("/projetos");
}

export async function updateTaskAction(formData: FormData) {
  const s = (await getCurrentSession())!;
  const taskId = String(formData.get("id") ?? "");
  if (!taskId) return;
  updateTask({
    profileId: s.profile.id,
    taskId,
    title: (formData.get("title") as string)?.trim() || undefined,
    project: (formData.get("project") as string) || undefined,
    priority: (formData.get("priority") as Priority) || undefined,
    deadline: formData.has("deadline") ? ((formData.get("deadline") as string) || null) : undefined,
    notes: formData.has("notes") ? ((formData.get("notes") as string) || null) : undefined,
  });
  revalidatePath("/tarefas");
  revalidatePath("/");
  revalidatePath("/projetos");
}

export async function toggleTaskAction(formData: FormData) {
  const s = (await getCurrentSession())!;
  const taskId = String(formData.get("id") ?? "");
  const done = formData.get("done") === "1";
  if (!taskId) return;
  toggleTaskDone({ profileId: s.profile.id, taskId, done });
  revalidatePath("/tarefas");
  revalidatePath("/");
  revalidatePath("/projetos");
}

export async function deleteTaskAction(formData: FormData) {
  const s = (await getCurrentSession())!;
  const taskId = String(formData.get("id") ?? "");
  if (!taskId) return;
  deleteTask({ profileId: s.profile.id, taskId });
  revalidatePath("/tarefas");
  revalidatePath("/");
  revalidatePath("/projetos");
}
