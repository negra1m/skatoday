// Web Push server-side com VAPID (web-push lib).
// Chaves VAPID compartilhadas com Sentinel — ver ACESSOS.md.

import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@localhost";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ausentes — push desabilitado");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!configure()) return { ok: false, error: "vapid-not-configured" };
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 3600, // 1 hora
      urgency: "normal",
    });
    return { ok: true };
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    // 410 Gone / 404 Not Found → subscription morta, deletar do banco
    if (code === 404 || code === 410) {
      return { ok: false, gone: true, error: `subscription-gone-${code}` };
    }
    return { ok: false, error: `${code ?? "unknown"}: ${(err as Error).message}` };
  }
}

export function getPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}
