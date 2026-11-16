"use client";

import * as React from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { buildReminderSchedule, nextReminderTime } from "@/lib/circuit";
import { getCurrentPushSubscription, subscribePush, unsubscribePush, testPush } from "@/lib/push-client";
import { updateCircuitConfigAction } from "@/app/(app)/academia/actions";

export function CircuitReminder({
  notificationsEnabled,
  windowStart,
  windowEnd,
  remindersPerDay,
}: {
  notificationsEnabled: boolean;
  windowStart: string;
  windowEnd: string;
  remindersPerDay: number;
}) {
  const [subscribed, setSubscribed] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [notif, setNotif] = React.useState(notificationsEnabled);

  const schedule = React.useMemo(
    () => buildReminderSchedule(windowStart, windowEnd, remindersPerDay),
    [windowStart, windowEnd, remindersPerDay],
  );
  const nextTime = React.useMemo(() => nextReminderTime(schedule), [schedule]);

  React.useEffect(() => {
    getCurrentPushSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    setMsg(null);
    const res = await subscribePush();
    if (res.ok) {
      setSubscribed(true);
      setMsg("Lembretes ativados! Vão chegar mesmo com o app fechado.");
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
    setMsg("Lembretes desativados no navegador.");
    setBusy(false);
  }

  async function handleTest() {
    setBusy(true);
    setMsg(null);
    const res = await testPush();
    setMsg(res.ok ? "Push de teste enviado." : `Falhou: ${res.error}`);
    setBusy(false);
  }

  const noSupport = typeof window !== "undefined" && !("Notification" in window);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          Lembretes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {noSupport ? (
          <p className="text-xs text-muted-foreground">Seu navegador não suporta notificações.</p>
        ) : (
          <>
            {notif && subscribed === false && (
              <Button onClick={handleSubscribe} disabled={busy} className="w-full">
                {busy ? "..." : "Ativar lembretes"}
              </Button>
            )}

            {notif && subscribed === true && (
              <>
                <p className="text-xs text-muted-foreground">
                  Ativo · {nextTime ? `próximo: ${nextTime}` : "nenhum lembrete restante hoje"}
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
          </>
        )}

        <form action={updateCircuitConfigAction} className="space-y-3 border-t border-border pt-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="windowStart">Início</Label>
              <Input id="windowStart" name="windowStart" type="time" defaultValue={windowStart} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="windowEnd">Fim</Label>
              <Input id="windowEnd" name="windowEnd" type="time" defaultValue={windowEnd} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="remindersPerDay">Lembretes</Label>
              <Select id="remindersPerDay" name="remindersPerDay" defaultValue={String(remindersPerDay)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notif} onCheckedChange={setNotif} />
            <span>Mandar lembretes</span>
            <input type="hidden" name="notificationsEnabled" value={notif ? "1" : "0"} />
          </label>

          <Button type="submit" variant="secondary" className="w-full">
            Salvar lembrete
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
