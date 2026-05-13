import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { tasksByProject } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEW_PROJECTS } from "@/lib/projects";
import { cn } from "@/lib/utils";

export default async function ProjetosPage() {
  const session = (await getCurrentSession())!;
  const map = tasksByProject(session.profile.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Projetos</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEW_PROJECTS.map((p) => {
          const stats = map.get(p) ?? { open: 0, done: 0, nextDeadline: null };
          const total = stats.open + stats.done;
          const pct = total === 0 ? 0 : Math.round((stats.done / total) * 100);
          const overdue = !!stats.nextDeadline && stats.nextDeadline < today;
          return (
            <Link key={p} href={`/tarefas?project=${encodeURIComponent(p)}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="truncate">{p}</span>
                    <span className="text-hud text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-hud text-2xl font-semibold tabular-nums">{stats.open}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {stats.done}/{total} feitas
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                  {stats.nextDeadline && (
                    <p
                      className={cn(
                        "text-[10px] uppercase tracking-widest",
                        overdue ? "text-red-400" : "text-muted-foreground",
                      )}
                    >
                      Próximo prazo: {stats.nextDeadline}
                      {overdue && " · atrasado"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
