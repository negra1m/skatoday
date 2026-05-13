import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentSession } from "@/lib/session";
import { updateRunAction } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function EditRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;
  const run = db
    .select()
    .from(schema.runs)
    .where(and(eq(schema.runs.id, id), eq(schema.runs.profileId, s.profile.id)))
    .get();
  if (!run) notFound();

  return (
    <div className="space-y-4">
      <Link href="/corrida" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Corrida
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Editar corrida</h1>

      <Card>
        <CardContent className="pt-4">
          <form action={updateRunAction} className="space-y-3">
            <input type="hidden" name="id" value={run.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={run.date} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" name="type" defaultValue={run.type ?? "leve"}>
                  <option value="leve">leve</option>
                  <option value="longa">longa</option>
                  <option value="tiro">tiro</option>
                  <option value="recuperacao">recuperação</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="distanceKm">Distância (km)</Label>
                <Input id="distanceKm" name="distanceKm" type="number" step="0.1" defaultValue={run.distanceKm ?? ""} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="durationMinutes">Tempo (min)</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" step="0.1" defaultValue={run.durationMinutes ?? ""} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={run.notes ?? ""} />
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
