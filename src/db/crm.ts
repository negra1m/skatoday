import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./client";
import type { Client, ClientImage, ClientLink, ClientSecret, NewClient } from "./schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

// ---- Queries ----

export function listClients(userId: string) {
  return db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.userId, userId))
    .orderBy(desc(schema.clients.updatedAt))
    .all();
}

export function getClient(userId: string, clientId: string): {
  client: Client;
  secrets: ClientSecret[];
  links: ClientLink[];
  images: ClientImage[];
} | null {
  const client = db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.userId, userId)))
    .get();
  if (!client) return null;
  const secrets = db
    .select()
    .from(schema.clientSecrets)
    .where(eq(schema.clientSecrets.clientId, clientId))
    .orderBy(desc(schema.clientSecrets.createdAt))
    .all();
  const links = db
    .select()
    .from(schema.clientLinks)
    .where(eq(schema.clientLinks.clientId, clientId))
    .orderBy(desc(schema.clientLinks.createdAt))
    .all();
  const images = db
    .select()
    .from(schema.clientImages)
    .where(eq(schema.clientImages.clientId, clientId))
    .orderBy(desc(schema.clientImages.createdAt))
    .all();
  return { client, secrets, links, images };
}

// ---- Client CRUD ----

export function createClient(input: {
  userId: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: NewClient["status"];
}) {
  return db
    .insert(schema.clients)
    .values({
      userId: input.userId,
      name: input.name.trim(),
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "lead",
    })
    .returning()
    .get();
}

export function updateClient(input: {
  userId: string;
  clientId: string;
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: NewClient["status"];
}) {
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.company !== undefined) patch.company = input.company;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.status !== undefined) patch.status = input.status;
  db.update(schema.clients)
    .set(patch)
    .where(and(eq(schema.clients.id, input.clientId), eq(schema.clients.userId, input.userId)))
    .run();
}

export function deleteClient(input: { userId: string; clientId: string }) {
  db.delete(schema.clients)
    .where(and(eq(schema.clients.id, input.clientId), eq(schema.clients.userId, input.userId)))
    .run();
}

// ---- Secrets (cofre encriptado) ----

export function addSecret(input: {
  clientId: string;
  label: string;
  username?: string | null;
  password: string;
  url?: string | null;
  notes?: string | null;
}) {
  const ciphertext = encryptSecret(input.password);
  return db
    .insert(schema.clientSecrets)
    .values({
      clientId: input.clientId,
      label: input.label.trim(),
      username: input.username ?? null,
      ciphertext,
      url: input.url ?? null,
      notes: input.notes ?? null,
    })
    .returning()
    .get();
}

export function revealSecret(secretId: string) {
  const row = db
    .select()
    .from(schema.clientSecrets)
    .where(eq(schema.clientSecrets.id, secretId))
    .get();
  if (!row) return null;
  try {
    return decryptSecret(row.ciphertext);
  } catch {
    return null;
  }
}

export function deleteSecret(secretId: string) {
  db.delete(schema.clientSecrets).where(eq(schema.clientSecrets.id, secretId)).run();
}

// ---- Links ----

export function addLink(input: { clientId: string; label: string; url: string }) {
  return db
    .insert(schema.clientLinks)
    .values({ clientId: input.clientId, label: input.label.trim(), url: input.url.trim() })
    .returning()
    .get();
}

export function deleteLink(linkId: string) {
  db.delete(schema.clientLinks).where(eq(schema.clientLinks.id, linkId)).run();
}

// ---- Images ----

export function addImage(input: { clientId: string; filename: string; caption?: string | null }) {
  return db
    .insert(schema.clientImages)
    .values({ clientId: input.clientId, filename: input.filename, caption: input.caption ?? null })
    .returning()
    .get();
}

export function deleteImage(imageId: string) {
  return db
    .delete(schema.clientImages)
    .where(eq(schema.clientImages.id, imageId))
    .returning()
    .get();
}
