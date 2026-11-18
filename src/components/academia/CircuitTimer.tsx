"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CircuitTimer({ durationMin }: { durationMin: number }) {
  const total = Math.max(1, Math.round(durationMin)) * 60;
  const [open, setOpen] = React.useState(false);
  const [remaining, setRemaining] = React.useState(total);
  const [running, setRunning] = React.useState(false);
  const wakeRef = React.useRef<WakeLockSentinel | null>(null);

  const finished = remaining === 0;

  // Tique de 1s enquanto roda.
  React.useEffect(() => {
    if (!open || !running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          try {
            navigator.vibrate?.([250, 120, 250]);
          } catch {
            /* sem vibração, tudo bem */
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open, running]);

  // Mantém a tela acordada durante o treino (best-effort).
  React.useEffect(() => {
    if (!open) return;
    let released = false;
    async function acquire() {
      try {
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* wake lock indisponível, segue o jogo */
      }
    }
    acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible" && open && !released) acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      try {
        wakeRef.current?.release();
      } catch {
        /* noop */
      }
      wakeRef.current = null;
    };
  }, [open]);

  function openTimer() {
    setRemaining(total);
    setRunning(true);
    setOpen(true);
  }

  function closeTimer() {
    setOpen(false);
    setRunning(false);
    setRemaining(total);
  }

  function toggle() {
    if (finished) {
      setRemaining(total);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  }

  function reset() {
    setRemaining(total);
    setRunning(true);
  }

  const pct = Math.round(((total - remaining) / total) * 100);

  return (
    <>
      <Button onClick={openTimer} variant="outline" className="w-full">
        <Timer className="mr-1 h-4 w-4" />
        Iniciar timer ({durationMin} min)
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Barra de topo: fechar */}
          <div
            className="flex items-center justify-between px-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Circuito · {durationMin} min
            </span>
            <button
              type="button"
              onClick={closeTimer}
              aria-label="Fechar timer"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Área grande: toque pra pausar/continuar */}
          <button
            type="button"
            onClick={toggle}
            className="flex flex-1 flex-col items-center justify-center gap-4 px-6"
            aria-label={running ? "Pausar" : "Continuar"}
          >
            <span
              className={
                "text-7xl font-semibold tabular-nums sm:text-8xl " +
                (finished ? "animate-pulse text-primary" : running ? "neon-glow" : "text-muted-foreground")
              }
            >
              {fmt(remaining)}
            </span>

            <span className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
              {finished ? (
                "Acabou! Toque pra repetir"
              ) : running ? (
                <>
                  <Pause className="h-4 w-4" /> Toque pra pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Pausado · toque pra continuar
                </>
              )}
            </span>

            {/* Progresso */}
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, background: "var(--neon-gradient)" }}
              />
            </div>
          </button>

          {/* Rodapé: reiniciar */}
          <div
            className="flex justify-center px-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <Button onClick={reset} variant="ghost" size="sm">
              <RotateCcw className="mr-1 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
