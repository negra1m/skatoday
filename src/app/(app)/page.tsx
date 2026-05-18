import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import {
  getSessionByDate,
  latestBodyLog,
  listSessionsInMonth,
  listRoutineForDate,
  listRuns,
  listJiu,
  urgentTasks,
  taskStats,
} from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakMap } from "@/components/hud/StreakMap";
import { FlowGauge } from "@/components/hud/FlowGauge";
import { DailyScore } from "@/components/hud/DailyScore";
import { TaskCard } from "@/components/tasks/TaskCard";
import { listActiveProjectNames } from "@/db/projects";
import { computeStreak, dailyScore } from "@/lib/xp";
import { todayISO } from "@/lib/utils";
import { listRoutineItems } from "@/db/routine";

export default async function DashboardPage() {
  const session = (await getCurrentSession())!;
  const today = todayISO();
  const [yyyy, mm] = today.split("-").map(Number);

  const monthSessions = listSessionsInMonth(session.profile.id, today.slice(0, 7));
  const cells = monthSessions.map((s) => {
    const dur = s.durationMinutes ?? 0;
    const intensity = (dur >= 90 ? 4 : dur >= 60 ? 3 : dur >= 30 ? 2 : 1) as 0 | 1 | 2 | 3 | 4;
    return { date: s.date, intensity };
  });

  const todaySession = getSessionByDate(session.profile.id, today);
  const body = latestBodyLog(session.profile.id);
  const routine = listRoutineForDate(session.profile.id, today);
  const routineItems = listRoutineItems(session.user.id);
  const routinePct = routineItems.length === 0
    ? 0
    : routine.filter((r) => r.done).length / routineItems.length;
  const runs = listRuns(session.profile.id);
  const jiu = listJiu(session.profile.id);
  const ranToday = runs.some((r) => r.date === today);
  const jiuToday = jiu.some((j) => j.date === today);

  const tStats = taskStats(session.profile.id);
  const score = dailyScore({
    skated: !!todaySession,
    bodyLogged: !!body && body.date === today,
    ran: ranToday,
    jiu: jiuToday,
    routinePct,
    tasksDoneToday: tStats.doneToday,
  });

  const streak = computeStreak(monthSessions.map((s) => s.date));
  const urgent = urgentTasks(session.profile.id, 5);
  const projectOptions = listActiveProjectNames(session.user.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DailyScore value={score} />
          <FlowGauge state={todaySession?.flowState ?? null} />
          <div className="grid grid-cols-3 gap-3 pt-1 text-hud">
            <Stat label="Streak" value={`${streak}d`} />
            <Stat label="Peso" value={body?.weightKg ? `${body.weightKg}kg` : "—"} />
            <Stat label="Energia" value={body?.energy ? `${body.energy}/10` : "—"} />
          </div>
        </CardContent>
      </Card>

      {urgent.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Urgentes
              {tStats.overdue > 0 && (
                <span className="ml-2 text-xs text-red-400">{tStats.overdue} atrasada{tStats.overdue > 1 ? "s" : ""}</span>
              )}
            </CardTitle>
            <Link
              href="/tarefas"
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgent.map((t) => (
              <TaskCard key={t.id} task={t} projectOptions={projectOptions} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {today.slice(0, 7)} — {monthSessions.length}{" "}
            {monthSessions.length === 1 ? "sessão" : "sessões"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakMap cells={cells} year={yyyy} month={mm} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hoje você...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QuickRow label="Skate" done={!!todaySession} href="/skate/sessao" />
          <QuickRow label="Corpo" done={!!body && body.date === today} href="/corpo" />
          <QuickRow label="Corrida" done={ranToday} href="/corrida" />
          <QuickRow label="Jiu" done={jiuToday} href="/jiu" />
          <QuickRow label="Rotina" done={routinePct >= 1} href="/rotina" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/skate/sessao"
          className="flex h-12 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Registrar sessão
        </Link>
        <Link
          href="/tarefas"
          className="flex h-12 items-center justify-center rounded-md border border-input bg-secondary text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Tarefas {tStats.open > 0 && `(${tStats.open})`}
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const isPositive = value !== "—" && value !== "0d" && value !== "0/10";
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={"text-lg font-semibold tabular-nums" + (isPositive ? " neon-glow" : "")}>{value}</span>
    </div>
  );
}

function QuickRow({ label, done, href }: { label: string; done: boolean; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
    >
      <span>{label}</span>
      <span
        className={
          done
            ? "text-[10px] uppercase tracking-widest text-foreground"
            : "text-[10px] uppercase tracking-widest text-muted-foreground"
        }
      >
        {done ? "ok" : "pendente"}
      </span>
    </Link>
  );
}
