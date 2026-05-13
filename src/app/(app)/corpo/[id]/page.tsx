import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentSession } from "@/lib/session";
import { updateBodyLogAction } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function EditBodyLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;
  const log = db
    .select()
    .from(schema.bodyLogs)
    .where(and(eq(schema.bodyLogs.id, id), eq(schema.bodyLogs.profileId, s.profile.id)))
    .get();
  if (!log) notFound();

  return (
    <div className="space-y-4">
      <Link href="/corpo" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Corpo
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Editar log</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{log.date}</p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBodyLogAction} className="space-y-3">
            <input type="hidden" name="id" value={log.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="weightKg" label="Peso (kg)" defaultValue={log.weightKg} step="0.1" />
              <Field name="bodyFatPct" label="Gordura %" defaultValue={log.bodyFatPct} step="0.1" />
              <Field name="visceralFat" label="Visceral" defaultValue={log.visceralFat} step="0.1" />
              <Field name="muscleMassKg" label="Músculo (kg)" defaultValue={log.muscleMassKg} step="0.1" />
              <Field name="waterPct" label="Água %" defaultValue={log.waterPct} step="0.1" />
              <Field name="sleepHours" label="Sono (h)" defaultValue={log.sleepHours} step="0.5" />
              <Field name="energy" label="Energia 1-10" defaultValue={log.energy} step="1" />
              <Field name="mood" label="Humor 1-10" defaultValue={log.mood} step="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={log.notes ?? ""} />
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
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
