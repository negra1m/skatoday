import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { getEffectiveGoalMl, ensureWaterConfig, getWaterLogForDate, listWaterHistory } from "@/db/water";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaterControls } from "@/components/water/WaterControls";
import { WaterConfigForm } from "@/components/water/WaterConfigForm";
import { WaterScheduler } from "@/components/water/WaterScheduler";

export default async function AguaPage() {
  const s = (await getCurrentSession())!;
  const cfg = ensureWaterConfig(s.profile.id);
  const goalMl = getEffectiveGoalMl(s.profile.id);
  const today = new Date().toISOString().slice(0, 10);
  const log = getWaterLogForDate(s.profile.id, today);
  const history = listWaterHistory(s.profile.id, 14);
  const isAuto = cfg.goalMl == null;

  return (
    <div className="space-y-4">
      <Link href="/eu" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Eu
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Água</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Meta hoje: {(goalMl / 1000).toFixed(1)}L {isAuto && "(auto)"}
      </p>

      <Card>
        <CardContent className="pt-4">
          <WaterControls
            goalMl={goalMl}
            glassSizeMl={cfg.glassSizeMl}
            initialDrunkMl={log?.mlDrunk ?? 0}
            initialGlasses={log?.glassesDrunk ?? 0}
          />
        </CardContent>
      </Card>

      <WaterScheduler
        goalMl={goalMl}
        glassSizeMl={cfg.glassSizeMl}
        wakeStart={cfg.wakeStart}
        wakeEnd={cfg.wakeEnd}
        notificationsEnabled={cfg.notificationsEnabled}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterConfigForm
            goalMl={cfg.goalMl}
            autoGoalMl={goalMl}
            glassSizeMl={cfg.glassSizeMl}
            wakeStart={cfg.wakeStart}
            wakeEnd={cfg.wakeEnd}
            notificationsEnabled={cfg.notificationsEnabled}
            soundEnabled={cfg.soundEnabled}
          />
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico ({history.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {history.map((h) => {
              const pct = h.goalMlSnapshot ? Math.min(100, Math.round((h.mlDrunk / h.goalMlSnapshot) * 100)) : 0;
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-hud w-20 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {h.date}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "var(--neon-gradient)" : "hsl(var(--foreground))",
                      }}
                    />
                  </div>
                  <span className="text-hud w-16 text-right text-xs tabular-nums">
                    {(h.mlDrunk / 1000).toFixed(1)}L
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
