import { Plus } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { listRoutineForDate } from "@/db/queries";
import { listRoutineItems } from "@/db/routine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import {
  createRoutineItemAction,
  deleteRoutineItemAction,
  toggleRoutineAction,
} from "./actions";
import { todayISO } from "@/lib/utils";

export default async function RotinaPage() {
  const s = (await getCurrentSession())!;
  const today = todayISO(s.user.timezone);
  const items = listRoutineItems(s.user.id);
  const checks = listRoutineForDate(s.profile.id, today);
  const doneMap = new Map(checks.map((c) => [c.taskKey, c.done]));
  const completed = items.filter((it) => doneMap.get(it.key) ?? false).length;

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Rotina</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{today}</p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRoutineItemAction} className="flex gap-2">
            <Input
              name="label"
              placeholder="ex: meditar, alongar, ler..."
              required
              maxLength={60}
              className="flex-1"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Hoje · {completed}/{items.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Nenhum item de rotina ainda.
            </p>
          ) : (
            items.map((item) => {
              const done = doneMap.get(item.key) ?? false;
              return (
                <LogSwipeRow
                  key={item.id}
                  id={item.id}
                  deleteAction={deleteRoutineItemAction}
                  confirmMessage={`Deletar "${item.label}"? Históricos antigos permanecem.`}
                >
                  <form action={toggleRoutineAction}>
                    <input type="hidden" name="date" value={today} />
                    <input type="hidden" name="taskKey" value={item.key} />
                    <input type="hidden" name="done" value={done ? "0" : "1"} />
                    <button
                      type="submit"
                      className={
                        "flex w-full items-center justify-between border border-border px-3 py-3 text-left transition-colors hover:bg-muted/40 " +
                        (done ? "bg-muted/50" : "bg-card")
                      }
                    >
                      <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {done ? "feito" : "pendente"}
                      </span>
                    </button>
                  </form>
                </LogSwipeRow>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
