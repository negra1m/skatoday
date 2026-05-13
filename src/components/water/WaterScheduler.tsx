"use client";

import * as React from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildSchedule, nextScheduledTime } from "@/lib/water";
import {
  getCurrentPushSubscription,
  subscribePush,
  unsubscribePush,
  testPush,
} from "@/lib/push-client";

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
  const [subscribed, setSubscribed] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const schedule = React.useMemo(
    () => buildSchedule({ goalMl, glassSizeMl, wakeStart, wakeEnd }),
    [goalMl, glassSizeMl, wakeStart, wakeEnd],
  );
  const nextTime = React.useMemo(() => nextScheduledTime(schedule), [schedule]);

  React.useEffect(() => {
    getCurrentPushSubscription().then((s) => setSubscribed(!!s));
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    setMsg(null);
    const res = await subscribePush();
    if (res.ok) {
      setSubscribed(true);
      setMsg("Notificações ativadas! Os lembretes vão chegar mesmo com o app fechado.");
    } else {
      setMsg(`Falhou: ${res.error}`);
    }
    setBusy(false);
  }

  async function handleUnsubscribe() {
    setBusy(true);
    setMsg(null);
    await unsubscribePush();
    setSubscribed(false);
    setMsg("Notificações desativadas.");
    setBusy(false);
  }

  async function handleTest() {
    setBusy(true);
    setMsg(null);
    const res = await testPush();
    setMsg(res.ok ? "Push de teste enviado." : `Falhou: ${res.error}`);
    setBusy(false);
  }

  if (typeof window !== "undefined" && !("Notification" in window)) {
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
          {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          Lembretes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!notificationsEnabled && (
          <p className="text-xs text-muted-foreground">
            Notificações desativadas nas configurações abaixo.
          </p>
        )}

        {notificationsEnabled && subscribed === false && (
          <Button onClick={handleSubscribe} disabled={busy} className="w-full">
            {busy ? "..." : "Ativar notificações"}
          </Button>
        )}

        {notificationsEnabled && subscribed === true && (
          <>
            <p className="text-xs text-muted-foreground">
              Ativo · {nextTime ? `próximo: ${nextTime}` : "nenhum horário restante hoje"}
            </p>
            <div className="flex flex-wrap gap-1">
              {schedule.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-hud text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={busy} variant="outline" size="sm" className="flex-1">
                <Send className="h-3.5 w-3.5" /> Testar
              </Button>
              <Button onClick={handleUnsubscribe} disabled={busy} variant="outline" size="sm" className="flex-1">
                Desativar
              </Button>
            </div>
          </>
        )}

        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </CardContent>
    </Card>
  );
}
