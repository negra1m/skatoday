import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { listRoutineForDate } from "@/db/queries";
import { toggleRoutine } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTINE_TASKS } from "@/lib/routine";
import { todayISO } from "@/lib/utils";

async function toggle(formData: FormData) {
  "use server";
  const s = (await getCurrentSession())!;
  const date = String(formData.get("date"));
  const taskKey = String(formData.get("taskKey"));
  const done = formData.get("done") === "1";
  toggleRoutine({ profileId: s.profile.id, date, taskKey, done });
  revalidatePath("/rotina");
  revalidatePath("/");
}

export default async function RotinaPage() {
  const s = (await getCurrentSession())!;
  const today = todayISO();
  const checks = listRoutineForDate(s.profile.id, today);
  const map = new Map(checks.map((c) => [c.taskKey, c.done]));
  const completed = checks.filter((c) => c.done).length;

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Rotina</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{today}</p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Hoje · {completed}/{ROUTINE_TASKS.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ROUTINE_TASKS.map((task) => {
            const done = map.get(task.key) ?? false;
            return (
              <form key={task.key} action={toggle}>
                <input type="hidden" name="date" value={today} />
                <input type="hidden" name="taskKey" value={task.key} />
                <input type="hidden" name="done" value={done ? "0" : "1"} />
                <button
                  type="submit"
                  className={
                    "flex w-full items-center justify-between rounded-md border border-border px-3 py-3 text-left transition-colors hover:bg-muted/40 " +
                    (done ? "bg-muted/50" : "")
                  }
                >
                  <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {task.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {done ? "feito" : "pendente"}
                  </span>
                </button>
              </form>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
