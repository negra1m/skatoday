"use client";

// Sistema dual de notificações de hidratação (portado de few-glasses).
// - Chrome/Edge: TimestampTrigger (notifica mesmo com app fechado)
// - Safari/Firefox: polling enquanto app aberto

type Schedule = string[]; // ["08:00", "09:30", ...]

const TAG_PREFIX = "skatoday-water:";

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.warn("[water] sw register failed", err);
    return null;
  }
}

function hasTimestampTrigger(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return "TimestampTrigger" in window || "showTrigger" in Notification.prototype;
  } catch {
    return false;
  }
}

export async function scheduleNotifications(schedule: Schedule, goalMl: number, glassSizeMl: number) {
  if (typeof window === "undefined") return;
  const perm = await requestPermission();
  if (perm !== "granted") return;
  const reg = await registerSW();
  if (!reg) return;

  // Cancela tags antigas
  try {
    const existing = await reg.getNotifications({ tag: undefined });
    for (const n of existing) {
      if (n.tag?.startsWith(TAG_PREFIX)) n.close();
    }
  } catch {
    // ignore
  }

  if (!hasTimestampTrigger()) {
    // Fallback: polling fica no client (ver useWaterPolling)
    return;
  }

  const now = new Date();
  for (const t of schedule) {
    const [h, m] = t.split(":").map(Number);
    const when = new Date(now);
    when.setHours(h, m, 0, 0);
    if (when.getTime() <= now.getTime()) continue;
    try {
      const TimestampTriggerCtor = (window as unknown as { TimestampTrigger: new (t: number) => unknown }).TimestampTrigger;
      await reg.showNotification("💧 Hora de beber água", {
        tag: TAG_PREFIX + t,
        body: `${glassSizeMl}ml — ${t}. Meta: ${goalMl}ml`,
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        showTrigger: new TimestampTriggerCtor(when.getTime()),
        renotify: true,
      } as NotificationOptions & { showTrigger?: unknown; renotify?: boolean });
    } catch (err) {
      console.warn("[water] schedule failed for", t, err);
    }
  }
}

// Polling para Safari/Firefox quando app aberto.
// Use dentro de um efeito React, retorna fn de cleanup.
export function startPollingFallback(opts: {
  schedule: Schedule;
  goalMl: number;
  glassSizeMl: number;
  onFire: (time: string) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};
  const fired = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);

  const check = async () => {
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    for (const t of opts.schedule) {
      const key = `${today}:${t}`;
      if (fired.has(key)) continue;
      if (cur >= t) {
        fired.add(key);
        if (Notification.permission === "granted") {
          try {
            new Notification("💧 Hora de beber água", {
              body: `${opts.glassSizeMl}ml — ${t}. Meta: ${opts.goalMl}ml`,
              icon: "/icons/icon-192.svg",
              tag: TAG_PREFIX + t,
            });
          } catch {
            // ignore
          }
        }
        opts.onFire(t);
      }
    }
  };

  check();
  const id = window.setInterval(check, 30_000);
  return () => window.clearInterval(id);
}
