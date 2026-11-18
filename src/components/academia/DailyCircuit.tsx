import Link from "next/link";
import { Check, ChevronDown, Dumbbell, Flame } from "lucide-react";
import {
  ensureCircuitConfig,
  getCircuitLogForDate,
  listCircuitDoneDatesSince,
  listCircuitHistory,
} from "@/db/circuit";
import { latestBodyLog } from "@/db/queries";
import { CIRCUIT, circuitStreak } from "@/lib/circuit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { StreakMap } from "@/components/hud/StreakMap";
import { CircuitReminder } from "@/components/academia/CircuitReminder";
import { CircuitTimer } from "@/components/academia/CircuitTimer";
import { saveCircuitLogAction, toggleCircuitDoneAction } from "@/app/(app)/academia/actions";

function intensityFor(rounds: number | null, minutes: number | null): 1 | 2 | 3 | 4 {
  if (minutes != null) return (minutes >= 25 ? 4 : minutes >= 20 ? 3 : minutes >= 10 ? 2 : 1) as 1 | 2 | 3 | 4;
  if (rounds != null) return (rounds >= 5 ? 3 : rounds >= 4 ? 2 : 1) as 1 | 2 | 3 | 4;
  return 1;
}

export async function DailyCircuit({
  profileId,
  today,
}: {
  profileId: string;
  today: string;
}) {
  const cfg = ensureCircuitConfig(profileId);
  const log = getCircuitLogForDate(profileId, today);
  const doneToday = !!log?.done;
  const history = listCircuitHistory(profileId, 30);
  const body = latestBodyLog(profileId);

  const [yyyy, mm] = today.split("-").map(Number);
  const monthPrefix = today.slice(0, 7);
  const since90 = new Date();
  since90.setUTCDate(since90.getUTCDate() - 120);
  const doneDates = listCircuitDoneDatesSince(profileId, since90.toISOString().slice(0, 10));
  const streak = circuitStreak(doneDates, today);
  const cells = history
    .filter((h) => h.done && h.date.startsWith(monthPrefix))
    .map((h) => ({
      date: h.date,
      intensity: intensityFor(h.rounds, h.durationMinutes),
      tricksCount: 0,
      durationMinutes: h.durationMinutes ?? null,
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Todo dia. Manter o ritmo e secar pra voltar a correr sem detonar o joelho.
        {body?.weightKg ? (
          <>
            {" "}
            <Link href="/corpo" className="text-foreground underline underline-offset-2">
              {body.weightKg}kg
            </Link>
          </>
        ) : null}
      </p>

      {/* Fiz hoje */}
      <Card>
        <CardContent className="space-y-3 pt-4">
          {doneToday ? (
            <>
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Treino feito hoje</span>
                {(log?.rounds != null || log?.durationMinutes != null) && (
                  <span className="text-xs text-muted-foreground">
                    {log?.rounds != null ? `${log.rounds} voltas` : ""}
                    {log?.rounds != null && log?.durationMinutes != null ? " · " : ""}
                    {log?.durationMinutes != null ? `${log.durationMinutes}min` : ""}
                  </span>
                )}
              </div>
              <form action={toggleCircuitDoneAction}>
                <SubmitButton variant="ghost" size="sm" pendingLabel="...">
                  Desfazer
                </SubmitButton>
              </form>
            </>
          ) : (
            <form action={toggleCircuitDoneAction}>
              <SubmitButton className="w-full" pendingLabel="Marcando...">
                <Check className="mr-1 h-4 w-4" />
                Fiz o treino hoje
              </SubmitButton>
            </form>
          )}

          <details>
            <summary className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <ChevronDown className="h-3 w-3" />
              Anotar voltas / duração
            </summary>
            <form action={saveCircuitLogAction} className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rounds">Voltas</Label>
                  <Input
                    id="rounds"
                    name="rounds"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={log?.rounds ?? ""}
                    placeholder="4"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="durationMinutes">Duração (min)</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={log?.durationMinutes ?? ""}
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Nota</Label>
                <Input id="notes" name="notes" defaultValue={log?.notes ?? ""} placeholder="Como foi?" />
              </div>
              <SubmitButton variant="secondary" className="w-full" pendingLabel="Salvando...">
                Salvar treino de hoje
              </SubmitButton>
            </form>
          </details>
        </CardContent>
      </Card>

      {/* Ritmo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-primary" />
            {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakMap cells={cells} year={yyyy} month={mm} />
        </CardContent>
      </Card>

      {/* O circuito */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{CIRCUIT.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{CIRCUIT.resumo}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Voltas: {CIRCUIT.voltasAlvo}</span>
            <span>Entre exercícios: {CIRCUIT.descansoEntreSeg}</span>
            <span>Entre voltas: {CIRCUIT.descansoEntreVoltasSeg}</span>
          </div>

          <CircuitTimer durationMin={CIRCUIT.duracaoMin} />

          <div className="space-y-2">
            {CIRCUIT.exercicios.map((ex, i) => (
              <details key={ex.key} className="border border-border bg-card px-3 py-2">
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">
                      {i + 1}. {ex.nome}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{ex.reps} reps</span>
                </summary>
                <div className="space-y-1 pt-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{ex.foco}</p>
                  <p className="text-xs">{ex.instrucao}</p>
                  {ex.alternativa !== "—" && (
                    <p className="text-[10px] text-muted-foreground">Alterna: {ex.alternativa}</p>
                  )}
                </div>
              </details>
            ))}
          </div>

          <details>
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              Ajuste de peso e ritmo
            </summary>
            <ul className="list-disc space-y-1 pt-2 pl-4 text-xs text-muted-foreground">
              {CIRCUIT.ajustes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </details>
        </CardContent>
      </Card>

      {/* Lembrete */}
      <CircuitReminder
        notificationsEnabled={cfg.notificationsEnabled}
        windowStart={cfg.windowStart}
        windowEnd={cfg.windowEnd}
        remindersPerDay={cfg.remindersPerDay}
      />

      {/* Histórico */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico ({history.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
                <span className="text-hud text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h.date}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {h.rounds ? <span className="tabular-nums">{h.rounds} voltas</span> : null}
                  {h.durationMinutes ? <span className="tabular-nums text-muted-foreground">{h.durationMinutes}min</span> : null}
                  {h.done ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">pulou</span>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
