import { getCurrentSession } from "@/lib/session";
import { listTasks, taskStats, type TaskFilters as TF } from "@/db/queries";
import { listActiveProjectNames } from "@/db/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskModal } from "@/components/tasks/TaskModal";
import { createTaskAction } from "./actions";
import { PRIORITIES, type Priority } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getT } from "@/lib/i18n/server";

const PRIORITY_LABEL_KEYS: Record<Priority, "tasks.priority_urgent" | "tasks.priority_next" | "tasks.priority_stable" | "tasks.priority_planned"> = {
  urgent: "tasks.priority_urgent",
  next: "tasks.priority_next",
  stable: "tasks.priority_stable",
  planned: "tasks.priority_planned",
};

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; priority?: Priority; q?: string; done?: string }>;
}) {
  const session = (await getCurrentSession())!;
  const t = await getT();
  const sp = await searchParams;
  const filters: TF = {
    project: sp.project ?? null,
    priority: (sp.priority as Priority) ?? null,
    search: sp.q ?? null,
    showDone: sp.done === "1",
  };
  const tasks = listTasks(session.profile.id, filters);
  const stats = taskStats(session.profile.id);
  const projectOptions = listActiveProjectNames(session.user.id);

  const grouped = !filters.priority
    ? PRIORITIES.map((p) => ({ priority: p, items: tasks.filter((t) => t.priority === p) }))
    : null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-hud text-2xl font-semibold">{t("tasks.title")}</h1>
        <TaskModal
          mode="create"
          action={createTaskAction}
          projectOptions={projectOptions}
          trigger={
            <Button type="button" size="sm">
              <Plus className="h-4 w-4" /> {t("tasks.new")}
            </Button>
          }
        />
      </header>

      <Card>
        <CardContent className="grid grid-cols-4 gap-2 py-3 text-center text-hud">
          <Stat label={t("tasks.open")} value={stats.open} />
          <Stat label={t("tasks.urgent")} value={stats.urgent} tone={stats.urgent > 0 ? "alert" : "neutral"} />
          <Stat label={t("tasks.overdue")} value={stats.overdue} tone={stats.overdue > 0 ? "alert" : "neutral"} />
          <Stat label={t("tasks.due_today")} value={stats.dueToday} tone={stats.dueToday > 0 ? "warn" : "neutral"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <TaskFilters projects={projectOptions} />
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("tasks.empty_hint")}
          </CardContent>
        </Card>
      ) : grouped ? (
        grouped.map((g) =>
          g.items.length === 0 ? null : (
            <Card key={g.priority}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm uppercase tracking-widest">
                  <span>{t(PRIORITY_LABEL_KEYS[g.priority])}</span>
                  <span className="text-muted-foreground">{g.items.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {g.items.map((task) => (
                  <TaskCard key={task.id} task={task} projectOptions={projectOptions} />
                ))}
              </CardContent>
            </Card>
          ),
        )
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectOptions={projectOptions} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "warn" | "alert" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span
        className={
          tone === "alert"
            ? "text-lg font-semibold tabular-nums text-red-400"
            : tone === "warn"
              ? "text-lg font-semibold tabular-nums text-amber-400"
              : "text-lg font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
