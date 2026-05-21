import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { getTrickById, listSessionTricksByTrick } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteTrickButton } from "@/components/skate/DeleteTrickButton";

export default async function TrickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getCurrentSession())!;
  const trick = getTrickById(session.profile.id, id);
  if (!trick) notFound();

  const history = listSessionTricksByTrick(id);
  const totalAttempts = history.reduce((acc, h) => acc + h.st.attempts, 0);
  const totalLands = history.reduce((acc, h) => acc + h.st.lands, 0);
  const bestStreak = history.reduce((acc, h) => Math.max(acc, h.st.bestStreak), 0);
  const rate = totalAttempts > 0 ? Math.round((totalLands / totalAttempts) * 100) : 0;
  const last = history[0]?.session.date ?? null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <Link href="/skate" className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ← Arsenal
        </Link>
        <h1 className="text-hud text-2xl font-semibold">{trick.name}</h1>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {trick.category} · {trick.stance} · lvl {trick.level} · status {trick.status}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 text-hud">
        <Stat label="XP total" value={String(trick.totalXp)} />
        <Stat label="Taxa" value={`${rate}%`} />
        <Stat label="Tentativas" value={String(totalAttempts)} />
        <Stat label="Acertos" value={String(totalLands)} />
        <Stat label="Melhor streak" value={String(bestStreak)} />
        <Stat label="Último treino" value={last ?? "—"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico ({history.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
          ) : (
            history.map((h) => (
              <div
                key={h.st.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                    {h.session.date}
                  </div>
                  <div className="text-sm">
                    {h.st.lands}/{h.st.attempts} · streak {h.st.bestStreak}
                    {h.st.isBaseRun && " · NA BASE"}
                  </div>
                  {h.st.notes && <div className="text-xs text-muted-foreground">{h.st.notes}</div>}
                </div>
                <div className="text-hud text-xs tabular-nums text-muted-foreground">
                  {h.st.attempts > 0 ? Math.round((h.st.lands / h.st.attempts) * 100) : 0}%
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Zona perigosa</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteTrickButton id={trick.id} name={trick.name} historyCount={history.length} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}
