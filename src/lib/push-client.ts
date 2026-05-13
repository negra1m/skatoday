"use client";

// Helpers client-side pra Web Push (subscribe/unsubscribe).

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribePush(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, error: "unsupported" };
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, error: "permission-denied" };

  const reg = await getRegistration();
  if (!reg) return { ok: false, error: "sw-failed" };

  // Pega public key do server
  const keyRes = await fetch("/api/push/subscribe", { method: "GET", cache: "no-store" });
  if (!keyRes.ok) return { ok: false, error: "key-fetch-failed" };
  const { publicKey } = (await keyRes.json()) as { publicKey: string };
  if (!publicKey) return { ok: false, error: "no-public-key" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
    } catch (err) {
      return { ok: false, error: `subscribe-failed: ${(err as Error).message}` };
    }
  }

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
  if (!res.ok) return { ok: false, error: "register-failed" };
  return { ok: true };
}

export async function unsubscribePush(): Promise<{ ok: boolean }> {
  const sub = await getCurrentPushSubscription();
  if (!sub) return { ok: true };
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
  return { ok: true };
}

export async function testPush(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/push/test", { method: "POST" });
  if (!res.ok) return { ok: false, error: `${res.status}` };
  return { ok: true };
}
