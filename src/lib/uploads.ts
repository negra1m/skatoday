import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./data/uploads";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function ensureDir() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveUploadedFile(file: File): Promise<string> {
  ensureDir();
  if (file.size > MAX_BYTES) throw new Error(`arquivo maior que ${MAX_BYTES / 1024 / 1024}MB`);
  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) throw new Error("tipo de arquivo não permitido");
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(UPLOADS_DIR, filename), buf);
  return filename;
}

export function getUploadedFile(filename: string): Buffer | null {
  // Sanitiza: só base name, sem path traversal
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) return null;
  const full = join(UPLOADS_DIR, safe);
  if (!existsSync(full)) return null;
  return readFileSync(full);
}

export function removeUploadedFile(filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) return;
  const full = join(UPLOADS_DIR, safe);
  if (existsSync(full)) unlinkSync(full);
}

export function contentTypeFor(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    }[ext] ?? "application/octet-stream"
  );
}
