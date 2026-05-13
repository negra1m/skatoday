"use client";

// Sistema dual de notificações de hidratação.
// - Chrome/Edge: TimestampTrigger (notifica mesmo com app fechado)
// - Safari/Firefox: polling enquanto app aberto
//
// IMPORTANTE: dispara só horários FUTUROS. Não bombardeia ao abrir a tela.

type Schedule = string[]; // ["08:00", "09:30", ...]

const TAG_PREFIX = "skatoday-water:";

// Marca em localStorage as notificações já disparadas hoje (por horário),
// pra evitar refire ao reabrir a aba.
function firedKey(date: string) {
  return `skatoday:water-fired:${date}`;
}

function getFiredToday(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(firedKey(today));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markFired(time: string) {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const set = getFiredToday();
  set.add(time);
  try {
    localStorage.setItem(firedKey(today), JSON.stringify([...set]));
  } catch {
    // quota cheia ou disabled, ignora
  }
}

// Limpa entradas de dias anteriores (housekeeping)
function cleanupOldFired() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("skatoday:water-fired:") && !key.endsWith(today)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

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

export function hasTimestampTrigger(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return "TimestampTrigger" in window;
  } catch {
    return false;
  }
}

// Agenda só horários AINDA não passados. Cancela tags futuras antigas
// (NÃO cancela as que já dispararam — deixa o usuário ver no histórico).
export async function scheduleNotifications(schedule: Schedule, goalMl: number, glassSizeMl: number) {
  if (typeof window === "undefined") return { scheduled: 0, supported: false };
  cleanupOldFired();
  const perm = await requestPermission();
  if (perm !== "granted") return { scheduled: 0, supported: false };
  if (!hasTimestampTrigger()) {
    return { scheduled: 0, supported: false };
  }
  const reg = await registerSW();
  if (!reg) return { scheduled: 0, supported: false };

  // Cancela apenas as notificações futuras pendentes (showTrigger ainda não disparou).
  // No browser elas aparecem em getNotifications() como pending até serem mostradas.
  try {
    const existing = await reg.getNotifications();
    for (const n of existing) {
      if (n.tag?.startsWith(TAG_PREFIX)) n.close();
    }
  } catch {
    // ignore
  }

  const now = Date.now();
  let scheduled = 0;
  for (const t of schedule) {
    const [h, m] = t.split(":").map(Number);
    const when = new Date();
    when.setHours(h, m, 0, 0);
    // Só agenda horários no futuro (com margem de 1 min pra evitar fire imediato)
    if (when.getTime() <= now + 60_000) continue;
    try {
      const TimestampTriggerCtor = (
        window as unknown as { TimestampTrigger: new (t: number) => unknown }
      ).TimestampTrigger;
      await reg.showNotification("💧 Hora de beber água", {
        tag: TAG_PREFIX + t,
        body: `${glassSizeMl}ml — Meta diária: ${(goalMl / 1000).toFixed(1)}L`,
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        silent: false,
        showTrigger: new TimestampTriggerCtor(when.getTime()),
      } as NotificationOptions & { showTrigger?: unknown });
      scheduled++;
    } catch (err) {
      console.warn("[water] schedule failed for", t, err);
    }
  }
  return { scheduled, supported: true };
}

// Polling Safari/Firefox: dispara só horário do "minuto atual" (não retroativo).
// Marca em localStorage pra não disparar de novo na próxima check.
export function startPollingFallback(opts: {
  schedule: Schedule;
  goalMl: number;
  glassSizeMl: number;
  onFire?: (time: string) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};
  if (hasTimestampTrigger()) return () => {}; // Chrome já tem trigger nativo

  cleanupOldFired();
  const fired = getFiredToday();

  const check = () => {
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    for (const t of opts.schedule) {
      if (fired.has(t)) continue;
      // Dispara só se o horário é EXATAMENTE este minuto (não retroativo de manhã toda)
      if (cur === t) {
        fired.add(t);
        markFired(t);
        if (Notification.permission === "granted") {
          try {
            new Notification("💧 Hora de beber água", {
              body: `${opts.glassSizeMl}ml — Meta diária: ${(opts.goalMl / 1000).toFixed(1)}L`,
              icon: "/icons/icon-192.svg",
              tag: TAG_PREFIX + t,
            });
          } catch {
            // ignore
          }
        }
        opts.onFire?.(t);
      }
    }
  };

  // 30s é o suficiente pra pegar o horário cheio (notifica até 30s atrasado)
  const id = window.setInterval(check, 30_000);
  return () => window.clearInterval(id);
}
