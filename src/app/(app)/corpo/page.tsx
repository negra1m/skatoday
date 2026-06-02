import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { listBodyLogs } from "@/db/queries";
import { logBody } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { WeightChart } from "@/components/hud/WeightChart";
import { deleteBodyLogAction } from "../actions";
import { todayISO } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { tf } from "@/lib/i18n/dict";

async function save(formData: FormData) {
  "use server";
  const s = (await getCurrentSession())!;
  const num = (k: string) => {
    const v = formData.get(k);
    return v ? Number(v) : null;
  };
  logBody({
    profileId: s.profile.id,
    date: todayISO(s.user.timezone),
    weightKg: num("weightKg"),
    bodyFatPct: num("bodyFatPct"),
    visceralFat: num("visceralFat"),
    muscleMassKg: num("muscleMassKg"),
    waterPct: num("waterPct"),
    energy: num("energy"),
    mood: num("mood"),
    sleepHours: num("sleepHours"),
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/corpo");
  redirect("/corpo");
}

export default async function CorpoPage() {
  const s = (await getCurrentSession())!;
  const t = await getT();
  const logs = listBodyLogs(s.profile.id);
  const last = logs[0];

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">{t("body.title")}</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("body.today_log")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field name="weightKg" label={t("body.weight")} defaultValue={last?.weightKg} step="0.1" />
              <Field name="bodyFatPct" label={t("body.fat_pct")} defaultValue={last?.bodyFatPct} step="0.1" />
              <Field name="visceralFat" label={t("body.visceral")} defaultValue={last?.visceralFat} step="0.1" />
              <Field name="muscleMassKg" label={t("body.muscle")} defaultValue={last?.muscleMassKg} step="0.1" />
              <Field name="waterPct" label={t("body.water_pct")} defaultValue={last?.waterPct} step="0.1" />
              <Field name="sleepHours" label={t("body.sleep_h")} defaultValue={last?.sleepHours} step="0.5" />
              <Field name="energy" label={t("body.energy_10")} defaultValue={last?.energy} step="1" />
              <Field name="mood" label={t("body.mood_10")} defaultValue={last?.mood} step="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              {t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {logs.filter((l) => l.weightKg != null).length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("body.evolution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightChart
              points={logs
                .filter((l) => l.weightKg != null)
                .map((l) => ({ date: l.date, weight: l.weightKg as number }))
                .reverse()}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tf(t("body.history_n"), { n: logs.length })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.map((l) => (
            <LogSwipeRow
              key={l.id}
              id={l.id}
              editHref={`/corpo/${l.id}`}
              deleteAction={deleteBodyLogAction}
              confirmMessage={t("body.confirm_delete")}
            >
              <div className="border border-border bg-card px-3 py-2">
                <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">{l.date}</div>
                <div className="text-sm">
                  {l.weightKg ? `${l.weightKg}kg` : "—"}
                  {l.bodyFatPct ? ` · ${l.bodyFatPct}% ${t("body.fat_short")}` : ""}
                  {l.energy ? ` · ${t("body.energy_short")} ${l.energy}` : ""}
                </div>
                {l.notes && <div className="mt-0.5 text-xs text-muted-foreground">{l.notes}</div>}
              </div>
            </LogSwipeRow>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" step={step} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
