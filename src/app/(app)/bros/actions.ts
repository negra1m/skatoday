"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import {
  acceptFriendship,
  findUserByUsername,
  removeFriendship,
  requestFriendship,
} from "@/db/friends";

async function requireSession() {
  const s = await getCurrentSession();
  if (!s) throw new Error("unauthorized");
  return s;
}

export async function sendFriendRequestAction(formData: FormData) {
  const s = await requireSession();
  const usernameRaw = String(formData.get("username") ?? "").trim().toLowerCase();
  const addresseeId = (formData.get("addresseeId") as string | null)?.trim() || null;

  let targetId = addresseeId;
  if (!targetId && usernameRaw) {
    const target = findUserByUsername(usernameRaw);
    if (!target) {
      revalidatePath("/bros/buscar");
      return;
    }
    targetId = target.id;
  }
  if (!targetId || targetId === s.user.id) return;

  try {
    requestFriendship(s.user.id, targetId);
  } catch {
    // ignora (self, duplicate, etc)
  }
  revalidatePath("/bros");
  revalidatePath("/bros/buscar");
}

export async function acceptFriendRequestAction(formData: FormData) {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  acceptFriendship(s.user.id, id);
  revalidatePath("/bros");
}

export async function removeFriendAction(formData: FormData) {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  removeFriendship(s.user.id, id);
  revalidatePath("/bros");
}
