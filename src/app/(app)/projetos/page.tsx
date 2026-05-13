import Link from "next/link";
import { Plus, Archive } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { projectStats } from "@/db/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import {
  archiveProjectAction,
  createProjectAction,
  deleteProjectAction,
} from "./actions";
import { cn } from "@/lib/utils";

export default async function ProjetosPage() {
  const s = (await getCurrentSession())!;
  const { projects, statsByName, today } = projectStats(s.user.id, s.profile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Projetos</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Novo projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProjectAction} className="flex gap-2">
            <Input
              name="name"
              placeholder="ex: estudos, freela cliente X..."
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

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum projeto ainda. Crie um pra organizar suas tarefas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => {
            const stats = statsByName.get(p.name) ?? { open: 0, done: 0, nextDeadline: null };
            const total = stats.open + stats.done;
            const pct = total === 0 ? 0 : Math.round((stats.done / total) * 100);
            const overdue = !!stats.nextDeadline && stats.nextDeadline < today;
            return (
              <LogSwipeRow
                key={p.id}
                id={p.id}
                deleteAction={deleteProjectAction}
                confirmMessage={`Deletar projeto "${p.name}"? Tarefas associadas mantém o nome mas viram órfãs.`}
              >
                <Link
                  href={`/tarefas?project=${encodeURIComponent(p.name)}`}
                  className="block border border-border bg-card px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <span className="text-hud text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-hud text-xl font-semibold tabular-nums">{stats.open}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {stats.done}/{total} feitas
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                  {stats.nextDeadline && (
                    <p
                      className={cn(
                        "mt-1 text-[10px] uppercase tracking-widest",
                        overdue ? "text-red-400" : "text-muted-foreground",
                      )}
                    >
                      Próximo prazo: {stats.nextDeadline}
                      {overdue && " · atrasado"}
                    </p>
                  )}
                </Link>
              </LogSwipeRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
