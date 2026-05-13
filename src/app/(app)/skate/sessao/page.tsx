import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { getSessionByDate, listSessionTricks, listTricks } from "@/db/queries";
import { upsertSession, logSessionTrick } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { deleteSessionTrickAction, deleteSkateSessionAction } from "../../actions";
import { todayISO } from "@/lib/utils";
import { FlowGauge } from "@/components/hud/FlowGauge";

async function saveSession(formData: FormData) {
  "use server";
  const session = (await getCurrentSession())!;
  const today = todayISO();
  upsertSession({
    profileId: session.profile.id,
    date: today,
    durationMinutes: Number(formData.get("duration")) || null,
    location: (formData.get("location") as string) || null,
    sessionType: (formData.get("session_type") as "flow") || null,
    feeling: Number(formData.get("feeling")) || null,
    confidence: Number(formData.get("confidence")) || null,
    pain: Number(formData.get("pain")) || null,
    flowState: (formData.get("flow_state") as "ok") || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/skate/sessao");
  redirect("/skate/sessao");
}

async function addTrickLog(formData: FormData) {
  "use server";
  const session = (await getCurrentSession())!;
  const today = todayISO();
  const sessionId = upsertSession({ profileId: session.profile.id, date: today });
  logSessionTrick({
    profileId: session.profile.id,
    sessionId,
    trickId: String(formData.get("trick_id")),
    attempts: Number(formData.get("attempts")),
    lands: Number(formData.get("lands")),
    bestStreak: Number(formData.get("best_streak")),
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/skate/sessao");
  redirect("/skate/sessao");
}

export default async function SessaoPage() {
  const session = (await getCurrentSession())!;
  const today = todayISO();
  const existing = getSessionByDate(session.profile.id, today);
  const tricks = listTricks(session.profile.id);
  const logs = existing ? listSessionTricks(existing.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-hud text-2xl font-semibold">Sessão de hoje</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{today}</p>
        </div>
        {existing && (
          <DeleteButton
            action={deleteSkateSessionAction}
            id={existing.id}
            message="Deletar a sessão inteira de hoje? Vai apagar todos os registros de tricks junto."
            size="md"
          />
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como foi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSession} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={0}
                  defaultValue={existing?.durationMinutes ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Local</Label>
                <Input id="location" name="location" defaultValue={existing?.location ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="session_type">Tipo</Label>
                <Select id="session_type" name="session_type" defaultValue={existing?.sessionType ?? "livre"}>
                  <option value="">—</option>
                  <option value="flow">flow</option>
                  <option value="tech">tech</option>
                  <option value="livre">livre</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="flow_state">Flow</Label>
                <Select id="flow_state" name="flow_state" defaultValue={existing?.flowState ?? ""}>
                  <option value="">—</option>
                  <option value="travado">travado</option>
                  <option value="ok">ok</option>
                  <option value="fluido">fluido</option>
                  <option value="absurdo">absurdo</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="feeling">Feeling</Label>
                <Input
                  id="feeling"
                  name="feeling"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={existing?.feeling ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confidence">Confiança</Label>
                <Input
                  id="confidence"
                  name="confidence"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={existing?.confidence ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pain">Dor</Label>
                <Input
                  id="pain"
                  name="pain"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={existing?.pain ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" defaultValue={existing?.notes ?? ""} rows={3} />
            </div>
            <FlowGauge state={existing?.flowState ?? null} />
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Adicionar trick treinada</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addTrickLog} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="trick_id">Trick</Label>
              <Select id="trick_id" name="trick_id" required defaultValue="">
                <option value="" disabled>
                  selecione
                </option>
                {tricks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="attempts">Tentativas</Label>
                <Input id="attempts" name="attempts" type="number" min={0} defaultValue={0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lands">Acertos</Label>
                <Input id="lands" name="lands" type="number" min={0} defaultValue={0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="best_streak">Maior streak</Label>
                <Input id="best_streak" name="best_streak" type="number" min={0} defaultValue={0} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="trick_notes">Notas</Label>
              <Textarea id="trick_notes" name="notes" rows={2} placeholder="faltou levantar joelho..." />
            </div>
            <Button type="submit" className="w-full">
              Registrar trick
            </Button>
          </form>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Treinadas hoje ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map((l) => (
              <LogSwipeRow
                key={l.st.id}
                id={l.st.id}
                deleteAction={deleteSessionTrickAction}
                confirmMessage="Deletar esse registro?"
              >
                <div className="flex items-center justify-between gap-2 border border-border bg-card px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{l.trick.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {l.st.lands}/{l.st.attempts} · streak {l.st.bestStreak}
                      {l.st.isBaseRun && " · NA BASE"}
                    </div>
                    {l.st.notes && <div className="mt-0.5 text-xs text-muted-foreground">{l.st.notes}</div>}
                  </div>
                  <span className="text-hud text-xs tabular-nums text-muted-foreground">
                    {l.st.attempts > 0 ? Math.round((l.st.lands / l.st.attempts) * 100) : 0}%
                  </span>
                </div>
              </LogSwipeRow>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
