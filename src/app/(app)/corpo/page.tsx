import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { listBodyLogs } from "@/db/queries";
import { logBody } from "@/db/mutations";
import { listBodyPhotos } from "@/db/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { WeightChart } from "@/components/hud/WeightChart";
import { deleteBodyLogAction, deleteBodyPhotoAction, uploadBodyPhotoAction } from "../actions";
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
    waistCm: num("waistCm"),
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
  const photos = listBodyPhotos(s.profile.id);

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
              <Field name="waistCm" label="Cintura (cm)" defaultValue={last?.waistCm} step="0.5" />
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

      {/* Fotos de acompanhamento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fotos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[10px] text-muted-foreground">
            Frente, lado e costas, mensalmente, com iluminação parecida. É o melhor termômetro do progresso.
          </p>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((ph) => (
                <div key={ph.id} className="group relative overflow-hidden rounded-md border border-border">
                  <Image
                    src={`/uploads/${ph.filename}`}
                    alt={ph.pose ?? "foto"}
                    width={300}
                    height={300}
                    className="aspect-square w-full object-cover"
                    unoptimized
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-background/80 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                    {ph.date}
                    {ph.pose ? ` · ${ph.pose}` : ""}
                  </span>
                  <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <DeleteButton action={deleteBodyPhotoAction} id={ph.id} message="Deletar essa foto?" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <form
            action={uploadBodyPhotoAction}
            encType="multipart/form-data"
            className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
          >
            <Input type="file" name="file" accept="image/*" required />
            <div className="grid grid-cols-2 gap-2">
              <Select name="pose" defaultValue="frente">
                <option value="frente">Frente</option>
                <option value="lado">Lado</option>
                <option value="costas">Costas</option>
                <option value="outro">Outro</option>
              </Select>
              <Input name="caption" placeholder="Legenda (opcional)" />
            </div>
            <Button type="submit" size="sm" className="w-full">
              Enviar foto
            </Button>
          </form>
        </CardContent>
      </Card>

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
