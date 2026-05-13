// Cofre de senhas — AES-256-GCM com chave derivada do SECRETS_KEY.
//
// Formato armazenado: "v1:<iv-b64>:<tag-b64>:<cipher-b64>"
// Sem chave, o ciphertext é inútil. Rotacionar SECRETS_KEY = perde acesso aos cofres.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

const VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM padrão

function getKey(): Buffer {
  const raw = process.env.SECRETS_KEY;
  if (!raw || raw.length < 32) {
    throw new Error("SECRETS_KEY ausente ou curto (mínimo 32 chars). Defina em .env");
  }
  // Deriva 32 bytes determinístico (SHA-256 do secret). Não é PBKDF2 mas suficiente
  // se o secret é forte. Para máxima segurança, troque por scryptSync com salt fixo.
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("ciphertext inválido ou versão não suportada");
  }
  const [, ivB, tagB, encB] = parts;
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(encB, "base64")), decipher.final()]);
  return dec.toString("utf8");
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "•".repeat(value.length);
  return value.slice(0, 2) + "•".repeat(Math.min(value.length - 4, 8)) + value.slice(-2);
}
