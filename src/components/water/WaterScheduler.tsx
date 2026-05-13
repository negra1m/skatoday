"use client";

import * as React from "react";
import { Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSchedule, nextScheduledTime } from "@/lib/water";
import {
  registerSW,
  requestPermission,
  scheduleNotifications,
  startPollingFallback,
} from "@/lib/water-notifications";

export function WaterScheduler({
  goalMl,
  glassSizeMl,
  wakeStart,
  wakeEnd,
  notificationsEnabled,
}: {
  goalMl: number;
  glassSizeMl: number;
  wakeStart: string;
  wakeEnd: string;
  notificationsEnabled: boolean;
}) {
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default");
  const [scheduled, setScheduled] = React.useState(false);
  const schedule = React.useMemo(
    () => buildSchedule({ goalMl, glassSizeMl, wakeStart, wakeEnd }),
    [goalMl, glassSizeMl, wakeStart, wakeEnd],
  );
  const nextTime = React.useMemo(() => nextScheduledTime(schedule), [schedule]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  React.useEffect(() => {
    if (!notificationsEnabled) return;
    if (permission !== "granted") return;
    registerSW().then(() => {
      scheduleNotifications(schedule, goalMl, glassSizeMl).then(() => setScheduled(true));
    });
    const cleanup = startPollingFallback({
      schedule,
      goalMl,
      glassSizeMl,
      onFire: () => {
        // refresh é via revalidatePath nas server actions
      },
    });
    return cleanup;
  }, [notificationsEnabled, permission, schedule, goalMl, glassSizeMl]);

  async function enable() {
    const perm = await requestPermission();
    setPermission(perm);
  }

  if (permission === "unsupported") {
    return (
      <Card>
        <CardContent className="py-3 text-center text-xs text-muted-foreground">
          Seu navegador não suporta notificações.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {notificationsEnabled && permission === "granted" ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          Lembretes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {permission === "default" && (
          <button
            type="button"
            onClick={enable}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Ativar notificações
          </button>
        )}
        {permission === "denied" && (
          <p className="text-xs text-destructive">
            Notificações bloqueadas no navegador. Habilite nas configurações.
          </p>
        )}
        {permission === "granted" && notificationsEnabled && (
          <>
            <p className="text-xs text-muted-foreground">
              {scheduled ? "Agendado" : "Agendando..."} ·{" "}
              {nextTime ? `próximo: ${nextTime}` : "nenhum horário restante hoje"}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {schedule.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-hud text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
        {permission === "granted" && !notificationsEnabled && (
          <p className="text-xs text-muted-foreground">
            Notificações desativadas. Ative em "Configuração" abaixo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
