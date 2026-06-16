import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import {
  getSessionByDate,
  latestBodyLog,
  listSessionsInMonth,
  listSessionsSince,
  listSessionTricksByMonth,
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
import { getT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const session = (await getCurrentSession())!;
  const t = await getT();
  const today = todayISO(session.user.timezone);
  const [yyyy, mm] = today.split("-").map(Number);

  const monthSessions = listSessionsInMonth(session.profile.id, today.slice(0, 7));
  const tricksByDate = listSessionTricksByMonth(session.profile.id, today.slice(0, 7));
  const cells = monthSessions.map((s) => {
    const dur = s.durationMinutes ?? 0;
    const intensity = (dur >= 90 ? 4 : dur >= 60 ? 3 : dur >= 30 ? 2 : 1) as 0 | 1 | 2 | 3 | 4;
    return { date: s.date, intensity, tricksCount: tricksByDate.get(s.date) ?? 0 };
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

  // Streak precisa cruzar virada de mês: pega últimos 90 dias.
  const streakStart = new Date();
  streakStart.setUTCDate(streakStart.getUTCDate() - 90);
  const recentSessions = listSessionsSince(session.profile.id, streakStart.toISOString().slice(0, 10));
  const streak = computeStreak(recentSessions.map((s) => s.date));
  const urgent = urgentTasks(session.profile.id, 5);
  const projectOptions = listActiveProjectNames(session.user.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dash.today")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DailyScore value={score} />
          <FlowGauge state={todaySession?.flowState ?? null} />
          <div className="grid grid-cols-3 gap-3 pt-1 text-hud">
            <Stat label={t("dash.streak")} value={`${streak}d`} />
            <Stat label={t("dash.weight")} value={body?.weightKg ? `${body.weightKg}kg` : "—"} />
            <Stat label={t("dash.energy")} value={body?.energy ? `${body.energy}/10` : "—"} />
          </div>
        </CardContent>
      </Card>

      {urgent.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {t("dash.urgent_tasks")}
              {tStats.overdue > 0 && (
                <span className="ml-2 text-xs text-red-400">
                  {tStats.overdue} {tStats.overdue === 1 ? t("dash.overdue_short_one").replace("{n}", "") : t("dash.overdue_short_other").replace("{n}", "")}
                </span>
              )}
            </CardTitle>
            <Link
              href="/tarefas"
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {t("common.see_all")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgent.map((task) => (
              <TaskCard key={task.id} task={task} projectOptions={projectOptions} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {today.slice(0, 7)} — {(monthSessions.length === 1
              ? t("dash.month_sessions_one")
              : t("dash.month_sessions_other")
            ).replace("{n}", String(monthSessions.length))}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakMap cells={cells} year={yyyy} month={mm} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dash.today_did")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QuickRow label={t("nav.skate")} done={!!todaySession} href="/skate/sessao" doneLabel={t("common.ok")} pendingLabel={t("common.pending")} />
          <QuickRow label={t("body.title")} done={!!body && body.date === today} href="/corpo" doneLabel={t("common.ok")} pendingLabel={t("common.pending")} />
          <QuickRow label={t("eu.run")} done={ranToday} href="/corrida" doneLabel={t("common.ok")} pendingLabel={t("common.pending")} />
          {session.user.role === "admin" && (
            <QuickRow label={t("eu.jiu")} done={jiuToday} href="/jiu" doneLabel={t("common.ok")} pendingLabel={t("common.pending")} />
          )}
          <QuickRow label={t("eu.routine")} done={routinePct >= 1} href="/rotina" doneLabel={t("common.ok")} pendingLabel={t("common.pending")} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/skate/sessao"
          className="flex h-12 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {t("dash.btn_log_session")}
        </Link>
        <Link
          href="/tarefas"
          className="flex h-12 items-center justify-center rounded-md border border-input bg-secondary text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          {t("dash.btn_tasks")} {tStats.open > 0 && `(${tStats.open})`}
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

function QuickRow({
  label,
  done,
  href,
  doneLabel,
  pendingLabel,
}: {
  label: string;
  done: boolean;
  href: string;
  doneLabel: string;
  pendingLabel: string;
}) {
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
        {done ? doneLabel : pendingLabel}
      </span>
    </Link>
  );
}
