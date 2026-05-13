"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { archiveProject, createProject, deleteProject, unarchiveProject, updateProject } from "@/db/projects";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

export async function createProjectAction(formData: FormData) {
  const s = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  try {
    createProject({ userId: s.user.id, name, color: (formData.get("color") as string) || null });
  } catch {
    // duplicado ou erro — silencia (botão volta sem feedback, pode evoluir)
  }
  revalidatePath("/projetos");
  revalidatePath("/tarefas");
}

export async function updateProjectAction(formData: FormData) {
  const s = await requireSession();
  const projectId = String(formData.get("id") ?? "");
  if (!projectId) return;
  updateProject({
    userId: s.user.id,
    projectId,
    name: (formData.get("name") as string)?.trim() || undefined,
    color: formData.has("color") ? ((formData.get("color") as string) || null) : undefined,
  });
  revalidatePath("/projetos");
  revalidatePath("/tarefas");
}

export async function archiveProjectAction(formData: FormData) {
  const s = await requireSession();
  const projectId = String(formData.get("id") ?? "");
  if (!projectId) return;
  archiveProject({ userId: s.user.id, projectId });
  revalidatePath("/projetos");
  revalidatePath("/tarefas");
}

export async function unarchiveProjectAction(formData: FormData) {
  const s = await requireSession();
  const projectId = String(formData.get("id") ?? "");
  if (!projectId) return;
  unarchiveProject({ userId: s.user.id, projectId });
  revalidatePath("/projetos");
  revalidatePath("/tarefas");
}

export async function deleteProjectAction(formData: FormData) {
  const s = await requireSession();
  const projectId = String(formData.get("id") ?? "");
  if (!projectId) return;
  deleteProject({ userId: s.user.id, projectId });
  revalidatePath("/projetos");
  revalidatePath("/tarefas");
}
