import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { listJiu } from "@/db/queries";
import { logJiu } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { deleteJiuAction } from "../actions";
import { todayISO } from "@/lib/utils";

async function save(formData: FormData) {
  "use server";
  const s = (await getCurrentSession())!;
  logJiu({
    profileId: s.profile.id,
    date: (formData.get("date") as string) || todayISO(),
    durationMinutes: Number(formData.get("durationMinutes")),
    rolls: Number(formData.get("rolls")),
    intensity: Number(formData.get("intensity")),
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/jiu");
  redirect("/jiu");
}

export default async function JiuPage() {
  const s = (await getCurrentSession())!;
  const sessions = listJiu(s.profile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Jiu</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">segunda obrigatório · quarta opcional</p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo treino</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={todayISO()} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="durationMinutes">Tempo (min)</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={90} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rolls">Rolls</Label>
                <Input id="rolls" name="rolls" type="number" min={0} defaultValue={0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="intensity">Intensidade 1-10</Label>
                <Input id="intensity" name="intensity" type="number" min={1} max={10} defaultValue={5} required />
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
          <CardTitle className="text-base">Histórico ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem treinos ainda.</p>
          ) : (
            sessions.map((j) => (
              <LogSwipeRow
                key={j.id}
                id={j.id}
                editHref={`/jiu/${j.id}`}
                deleteAction={deleteJiuAction}
                confirmMessage="Deletar esse treino?"
              >
                <div className="border border-border bg-card px-3 py-2">
                  <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">{j.date}</div>
                  <div className="text-sm">
                    {j.durationMinutes}min · {j.rolls} rolls · intensidade {j.intensity}
                  </div>
                  {j.notes && <div className="mt-0.5 text-xs text-muted-foreground">{j.notes}</div>}
                </div>
              </LogSwipeRow>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
