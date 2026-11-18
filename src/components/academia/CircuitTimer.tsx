"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Pause, Play, RotateCcw, SkipForward, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveCircuitLogAction } from "@/app/(app)/academia/actions";

type Ex = { nome: string; reps: string; foco: string };
type Phase = "exercise" | "rest" | "done";

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CircuitTimer({
  durationMin,
  exercises,
  restBetweenSec = 30,
  restRoundSec = 90,
}: {
  durationMin: number;
  exercises: Ex[];
  restBetweenSec?: number;
  restRoundSec?: number;
}) {
  const total = Math.max(1, Math.round(durationMin)) * 60;
  const lastEx = exercises.length - 1;
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [remaining, setRemaining] = React.useState(total);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("exercise");
  const [exIndex, setExIndex] = React.useState(0);
  const [nextIndex, setNextIndex] = React.useState(0);
  const [rounds, setRounds] = React.useState(0);
  const [restLeft, setRestLeft] = React.useState(0);
  const savedRef = React.useRef(false);
  const wakeRef = React.useRef<WakeLockSentinel | null>(null);

  // Relógio-mestre: desconta enquanto roda e não terminou (inclui descanso).
  React.useEffect(() => {
    if (!open || !running || phase === "done") return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [open, running, phase]);

  // Chegou a zero → encerra.
  React.useEffect(() => {
    if (open && phase !== "done" && remaining === 0) {
      setPhase("done");
      setRunning(false);
    }
  }, [open, phase, remaining]);

  // Descanso: desconta enquanto roda e está em descanso.
  React.useEffect(() => {
    if (!open || !running || phase !== "rest") return;
    const id = setInterval(() => setRestLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, [open, running, phase]);

  // Descanso acabou → engata o próximo exercício.
  React.useEffect(() => {
    if (open && phase === "rest" && restLeft === 0) {
      setExIndex(nextIndex);
      setPhase("exercise");
      try {
        navigator.vibrate?.(80);
      } catch {
        /* noop */
      }
    }
  }, [open, phase, restLeft, nextIndex]);

  // Encerrou → salva as voltas feitas (uma vez).
  React.useEffect(() => {
    if (!open || phase !== "done" || savedRef.current) return;
    try {
      navigator.vibrate?.([250, 120, 250]);
    } catch {
      /* noop */
    }
    void persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  // Mantém a tela acordada durante o treino (best-effort).
  React.useEffect(() => {
    if (!open) return;
    async function acquire() {
      try {
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* indisponível */
      }
    }
    acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible" && open) acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      try {
        wakeRef.current?.release();
      } catch {
        /* noop */
      }
      wakeRef.current = null;
    };
  }, [open]);

  async function persist() {
    if (savedRef.current || rounds <= 0) return;
    savedRef.current = true;
    const fd = new FormData();
    fd.set("rounds", String(rounds));
    fd.set("durationMinutes", String(Math.max(1, Math.round((total - remaining) / 60))));
    try {
      await saveCircuitLogAction(fd);
      router.refresh();
    } catch {
      savedRef.current = false;
    }
  }

  function openTimer() {
    setRemaining(total);
    setPhase("exercise");
    setExIndex(0);
    setNextIndex(0);
    setRounds(0);
    setRestLeft(0);
    savedRef.current = false;
    setRunning(true);
    setOpen(true);
  }

  async function closeTimer() {
    await persist();
    setOpen(false);
    setRunning(false);
  }

  function reset() {
    setRemaining(total);
    setPhase("exercise");
    setExIndex(0);
    setNextIndex(0);
    setRounds(0);
    setRestLeft(0);
    savedRef.current = false;
    setRunning(true);
  }

  /** "Feito" no exercício → entra no descanso (e conta volta ao fechar os 4). */
  function feito() {
    if (phase !== "exercise") return;
    if (exIndex < lastEx) {
      setNextIndex(exIndex + 1);
      setRestLeft(restBetweenSec);
    } else {
      setRounds((n) => n + 1);
      setNextIndex(0);
      setRestLeft(restRoundSec);
    }
    setPhase("rest");
  }

  function skipRest() {
    setExIndex(nextIndex);
    setRestLeft(0);
    setPhase("exercise");
  }

  const current = exercises[exIndex];
  const upcoming = exercises[nextIndex];
  const pct = Math.round(((total - remaining) / total) * 100);

  return (
    <>
      <Button onClick={openTimer} variant="outline" className="w-full">
        <Timer className="mr-1 h-4 w-4" />
        Iniciar timer ({durationMin} min)
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Topo: relógio-mestre + pausa + fechar */}
          <div
            className="flex items-center justify-between px-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold tabular-nums">{fmt(remaining)}</span>
              {phase !== "done" && (
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  aria-label={running ? "Pausar" : "Continuar"}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {rounds} {rounds === 1 ? "volta" : "voltas"}
            </span>
            <button
              type="button"
              onClick={closeTimer}
              aria-label="Encerrar"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Corpo */}
          {phase === "exercise" && current && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Volta {rounds + 1} · exercício {exIndex + 1}/{exercises.length} · {current.foco}
                </p>
                <h2 className="text-3xl font-semibold leading-tight">{current.nome}</h2>
                <p className="text-lg text-primary">{current.reps} reps</p>
              </div>
              <Button onClick={feito} size="lg" className="h-16 w-full max-w-xs text-lg">
                <Check className="mr-2 h-6 w-6" />
                Feito
              </Button>
              {!running && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pausado</p>
              )}
            </div>
          )}

          {phase === "rest" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Descanso</p>
              <span className="text-7xl font-semibold tabular-nums neon-glow">{fmt(restLeft)}</span>
              {upcoming && (
                <p className="text-sm text-muted-foreground">
                  Próximo: <span className="text-foreground">{upcoming.nome}</span> · {upcoming.reps} reps
                  {nextIndex === 0 ? " · nova volta" : ""}
                </p>
              )}
              <Button onClick={skipRest} variant="outline" size="lg" className="w-full max-w-xs">
                <SkipForward className="mr-2 h-5 w-5" />
                Pular descanso
              </Button>
              {!running && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pausado</p>
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <Check className="h-14 w-14 text-primary" />
              <h2 className="text-3xl font-semibold">Acabou!</h2>
              <p className="text-lg text-muted-foreground">
                {rounds} {rounds === 1 ? "volta" : "voltas"}
                {rounds > 0 ? " salvas no treino de hoje" : ""}
              </p>
              <Button onClick={closeTimer} size="lg" className="w-full max-w-xs">
                Fechar
              </Button>
            </div>
          )}

          {/* Rodapé: progresso + reiniciar */}
          <div
            className="space-y-3 px-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, background: "var(--neon-gradient)" }}
              />
            </div>
            {phase !== "done" && (
              <div className="flex justify-center">
                <Button onClick={reset} variant="ghost" size="sm">
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Reiniciar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
