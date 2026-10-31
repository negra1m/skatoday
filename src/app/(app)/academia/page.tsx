import Link from "next/link";
import { ChevronDown, ChevronUp, Dumbbell, Target } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import {
  ensureTestWorkouts,
  getProfileLevel,
  hasProgram,
  listGymSessions,
  listWorkoutExercises,
  listWorkoutsForLevel,
  testResult,
} from "@/db/gym";
import { LEVELS, RPE_SCALE, TEST_BLOCK, UNIT_LABEL, levelInfo } from "@/lib/gym";
import { todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteGymSessionAction,
  levelDownAction,
  levelUpAction,
  placementAction,
  seedProgramAction,
  startSessionAction,
} from "./actions";

export default async function AcademiaPage() {
  const s = (await getCurrentSession())!;
  const today = todayISO(s.user.timezone);

  if (!hasProgram(s.profile.id)) {
    return (
      <div className="space-y-4">
        <h1 className="text-hud text-2xl font-semibold">Academia</h1>
        <EmptyProgram />
      </div>
    );
  }

  // Heal: cria os testes de passagem se o perfil foi semeado antes deles.
  ensureTestWorkouts(s.profile.id);

  const level = getProfileLevel(s.profile.id);
  const info = levelInfo(level);
  const blocks = listWorkoutsForLevel(s.profile.id, level).filter((b) => b.block !== TEST_BLOCK);
  const counts = new Map(blocks.map((b) => [b.id, listWorkoutExercises(b.id).length]));
  const test = testResult(s.profile.id, level);
  const sessions = listGymSessions(s.profile.id);
  const todaySession = sessions.find((r) => r.session.date === today);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Academia</h1>

      {/* Nível atual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Nível {level} — {info.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{info.objetivo}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Faixa: {info.faixa}</span>
            <span>Frequência: {info.frequencia}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Semana: </span>
            {info.weekly}
          </p>
        </CardContent>
      </Card>

      {/* Treino de hoje */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Treino de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaySession ? (
            <>
              <p className="text-sm">
                {todaySession.workout?.name ?? "Treino livre"}
                <span className="text-muted-foreground"> · em andamento</span>
              </p>
              <Link href={`/academia/sessao/${todaySession.session.id}`} className="block">
                <Button className="w-full">Continuar treino</Button>
              </Link>
            </>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <form key={b.id} action={startSessionAction}>
                  <input type="hidden" name="workoutId" value={b.id} />
                  <SubmitButton
                    variant="outline"
                    className="flex w-full items-center justify-between"
                    pendingLabel="Abrindo..."
                  >
                    <span className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {b.block ? `${b.block} · ` : ""}
                      {b.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {counts.get(b.id) ?? 0} ex
                    </span>
                  </SubmitButton>
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teste de passagem (gate) */}
      {test ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Teste de passagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bata todas as metas num treino pra liberar o nível {level + 1}. Não passou? Repete o
              nível e tenta de novo.
            </p>
            <ul className="space-y-1 text-sm">
              {test.items.map((i) => (
                <li key={i.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className={i.best == null ? "text-muted-foreground" : i.ok ? "text-primary" : "text-red-400"}>
                      {i.best == null ? "▢" : i.ok ? "✓" : "✗"}
                    </span>
                    {i.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {i.best != null ? `${i.best}/` : ""}
                    {i.target} {UNIT_LABEL[i.unit]}
                  </span>
                </li>
              ))}
            </ul>

            <form action={startSessionAction}>
              <input type="hidden" name="workoutId" value={test.workoutId} />
              <SubmitButton variant="secondary" className="w-full" pendingLabel="Abrindo...">
                {test.hasAttempt ? "Refazer o teste" : "Fazer o teste de passagem"}
              </SubmitButton>
            </form>

            {test.passed ? (
              <form action={levelUpAction}>
                <SubmitButton className="w-full">
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Passou! Subir pro nível {level + 1}
                </SubmitButton>
              </form>
            ) : (
              test.hasAttempt && (
                <p className="text-xs text-red-400">
                  Ainda não passou — faltou:{" "}
                  {test.items.filter((i) => !i.ok).map((i) => i.name).join(", ")}. Repete o nível.
                </p>
              )
            )}

            {level > 0 && (
              <form action={levelDownAction} className="pt-1">
                <SubmitButton variant="ghost" size="sm">
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Descer de nível
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-sm">Nível Master — topo da progressão.</p>
            <p className="text-xs text-muted-foreground">
              Não há teste acima: aqui é escolher a dose certa pro objetivo certo.
            </p>
            {level > 0 && (
              <form action={levelDownAction} className="pt-1">
                <SubmitButton variant="ghost" size="sm">
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Descer de nível
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teste de colocação */}
      <Card>
        <CardContent className="py-3">
          <details>
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              Teste de colocação (refazer meu nível)
            </summary>
            <form action={placementAction} className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Seus melhores números de hoje. O nível sai do padrão mais fraco — cardio não entra,
                força relativa é outro eixo.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <PlaceField name="squat" label="Agachamentos livres" />
                <PlaceField name="push" label="Flexões no chão" />
                <PlaceField name="pull" label="Pull-ups livres" />
                <PlaceField name="hang" label="Hang (segundos)" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Sem pull-up? Deixe 0 e preencha o hang. Isso sobrescreve seu nível atual.
              </p>
              <SubmitButton className="w-full" variant="outline" pendingLabel="Calculando...">
                Calcular meu nível
              </SubmitButton>
            </form>
          </details>
        </CardContent>
      </Card>

      {/* Referência de esforço (RPE) */}
      <Card>
        <CardContent className="py-3">
          <details>
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">
              Escala de esforço (RPE)
            </summary>
            <div className="space-y-1 pt-3">
              {RPE_SCALE.map((r) => (
                <div key={r.rpe} className="flex items-baseline gap-2 text-xs">
                  <span className="w-5 font-medium tabular-nums">{r.rpe}</span>
                  <span className="flex-1">{r.label}</span>
                  <span className="text-muted-foreground">{r.reserva}</span>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>
          )}
          {sessions.map(({ session, workout }) => (
            <LogSwipeRow
              key={session.id}
              id={session.id}
              editHref={`/academia/sessao/${session.id}`}
              deleteAction={deleteGymSessionAction}
              confirmMessage="Deletar esse treino?"
            >
              <div className="border border-border bg-card px-3 py-2">
                <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                  {session.date}
                </div>
                <div className="text-sm">
                  {workout?.name ?? "Treino livre"}
                  {session.durationMinutes ? ` · ${session.durationMinutes}min` : ""}
                </div>
                {session.notes && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{session.notes}</div>
                )}
              </div>
            </LogSwipeRow>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceField({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={0} inputMode="numeric" defaultValue="" placeholder="0" />
    </div>
  );
}

/** Primeira visita: apresenta o programa de calistenia antes de gravar nada. */
function EmptyProgram() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Programa de calistenia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Progressão de peso corporal do sedentário ao nível Master. Depois de carregar, faça o teste
          de colocação pra pular os níveis que já estão abaixo de você — e suba passando no teste de
          cada nível.
        </p>
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <div key={l.id} className="border border-border bg-card px-3 py-2">
              <div className="text-hud text-xs uppercase tracking-widest text-muted-foreground">
                Nível {l.id} · {l.faixa}
              </div>
              <div className="text-sm">{l.name}</div>
              <div className="text-xs text-muted-foreground">{l.objetivo}</div>
            </div>
          ))}
        </div>
        <form action={seedProgramAction}>
          <SubmitButton className="w-full" pendingLabel="Carregando...">
            Carregar programa de calistenia
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
