"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  addImage,
  addLink,
  addSecret,
  createClient,
  deleteClient,
  deleteImage,
  deleteLink,
  deleteSecret,
  revealSecret,
  updateClient,
} from "@/db/crm";
import { removeUploadedFile, saveUploadedFile } from "@/lib/uploads";
import type { NewClient } from "@/db/schema";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthorized");
  if (user.role !== "admin") throw new Error("forbidden");
  return user;
}

export async function createClientAction(formData: FormData) {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const row = createClient({
    userId: user.id,
    name,
    company: (formData.get("company") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as NewClient["status"]) ?? "lead",
  });
  revalidatePath("/clientes");
  redirect(`/clientes/${row.id}`);
}

export async function updateClientAction(formData: FormData) {
  const user = await requireAdmin();
  const clientId = String(formData.get("id") ?? "");
  if (!clientId) return;
  updateClient({
    userId: user.id,
    clientId,
    name: (formData.get("name") as string)?.trim() || undefined,
    company: formData.has("company") ? ((formData.get("company") as string) || null) : undefined,
    email: formData.has("email") ? ((formData.get("email") as string) || null) : undefined,
    phone: formData.has("phone") ? ((formData.get("phone") as string) || null) : undefined,
    notes: formData.has("notes") ? ((formData.get("notes") as string) || null) : undefined,
    status: (formData.get("status") as NewClient["status"]) || undefined,
  });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function deleteClientAction(formData: FormData) {
  const user = await requireAdmin();
  const clientId = String(formData.get("id") ?? "");
  if (!clientId) return;
  deleteClient({ userId: user.id, clientId });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function addSecretAction(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!clientId || !label || !password) return;
  addSecret({
    clientId,
    label,
    username: (formData.get("username") as string) || null,
    password,
    url: (formData.get("url") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath(`/clientes/${clientId}`);
}

export async function revealSecretAction(secretId: string): Promise<string | null> {
  await requireAdmin();
  return revealSecret(secretId);
}

export async function deleteSecretAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (id) deleteSecret(id);
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

export async function addLinkAction(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!clientId || !label || !url) return;
  addLink({ clientId, label, url });
  revalidatePath(`/clientes/${clientId}`);
}

export async function deleteLinkAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (id) deleteLink(id);
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

export async function uploadImageAction(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const caption = (formData.get("caption") as string) || null;
  const file = formData.get("file");
  if (!clientId || !(file instanceof File) || file.size === 0) return;
  const filename = await saveUploadedFile(file);
  addImage({ clientId, filename, caption });
  revalidatePath(`/clientes/${clientId}`);
}

export async function deleteImageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (id) {
    const removed = deleteImage(id);
    if (removed?.filename) removeUploadedFile(removed.filename);
  }
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}
