import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { listRuns } from "@/db/queries";
import { logRun } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { deleteRunAction } from "../actions";
import { todayISO } from "@/lib/utils";

async function save(formData: FormData) {
  "use server";
  const s = (await getCurrentSession())!;
  logRun({
    profileId: s.profile.id,
    date: (formData.get("date") as string) || todayISO(),
    distanceKm: Number(formData.get("distanceKm")),
    durationMinutes: Number(formData.get("durationMinutes")),
    type: (formData.get("type") as "leve") || "leve",
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/corrida");
  redirect("/corrida");
}

export default async function CorridaPage() {
  const s = (await getCurrentSession())!;
  const runs = listRuns(s.profile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Corrida</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nova corrida</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={todayISO()} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" name="type" defaultValue="leve">
                  <option value="leve">leve</option>
                  <option value="longa">longa</option>
                  <option value="tiro">tiro</option>
                  <option value="recuperacao">recuperação</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="distanceKm">Distância (km)</Label>
                <Input id="distanceKm" name="distanceKm" type="number" step="0.1" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="durationMinutes">Tempo (min)</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" step="0.1" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico ({runs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem corridas ainda. Recordes pessoais: 12km/56min, 13km/1h06, 17km máximo.</p>
          ) : (
            runs.map((r) => (
              <LogSwipeRow
                key={r.id}
                id={r.id}
                editHref={`/corrida/${r.id}`}
                deleteAction={deleteRunAction}
                confirmMessage="Deletar essa corrida?"
              >
                <div className="border border-border bg-card px-3 py-2">
                  <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                    {r.date} · {r.type}
                  </div>
                  <div className="text-sm">
                    {r.distanceKm}km · {r.durationMinutes}min · {r.pace}
                  </div>
                  {r.notes && <div className="mt-0.5 text-xs text-muted-foreground">{r.notes}</div>}
                </div>
              </LogSwipeRow>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
