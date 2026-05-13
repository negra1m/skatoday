import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { db, schema } from "@/db/client";

const COOKIE_NAME = "skatoday_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const BCRYPT_ROUNDS = 12;

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET ausente ou curto (mínimo 32 chars). Defina em .env");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function issueSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = String(payload.sub ?? "");
    if (!userId) return null;
    const user = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), eq(schema.users.active, true)))
      .get();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id)).get();
  if (!profile) return null;
  return { user, profile };
}

// ---- Password reset ----

export function generateResetToken() {
  // 32 bytes random → base64url (~43 chars)
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetRequest(userId: string) {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h
  db.insert(schema.passwordResets)
    .values({ userId, tokenHash, expiresAt })
    .run();
  return token; // só retornado uma vez — pra mandar no email
}

export function consumeResetToken(token: string) {
  const tokenHash = hashResetToken(token);
  const now = new Date().toISOString();
  const row = db
    .select()
    .from(schema.passwordResets)
    .where(
      and(
        eq(schema.passwordResets.tokenHash, tokenHash),
        gt(schema.passwordResets.expiresAt, now),
        isNull(schema.passwordResets.usedAt),
      ),
    )
    .get();
  if (!row) return null;
  return row;
}

export function markResetUsed(id: string) {
  db.update(schema.passwordResets)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(schema.passwordResets.id, id))
    .run();
}

// Comparação constant-time pra strings (extra paranoia em validações sensíveis)
export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
