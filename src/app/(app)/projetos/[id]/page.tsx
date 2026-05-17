import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ListChecks, Pencil } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { getProjectById, listClientsOfProject } from "@/db/projects";
import { listTasks } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { listActiveProjectNames } from "@/db/projects";
import {
  archiveProjectAction,
  unarchiveProjectAction,
  updateProjectAction,
} from "../actions";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = (await getCurrentSession())!;
  const { id } = await params;
  const project = getProjectById(session.user.id, id);
  if (!project) notFound();

  const linkedClients = session.user.role === "admin" ? listClientsOfProject(project.id) : [];
  // Tasks filtradas pelo nome do projeto (model atual é por string)
  const tasks = listTasks(session.profile.id, { project: project.name, showDone: false });
  const projectOptions = listActiveProjectNames(session.user.id);

  const open = tasks.length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.deadline && t.deadline < today).length;
  const dueToday = tasks.filter((t) => t.deadline === today).length;

  return (
    <div className="space-y-4">
      <Link href="/projetos" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Projetos
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-hud text-2xl font-semibold truncate">{project.name}</h1>
          {project.archivedAt && (
            <p className="text-[10px] uppercase tracking-widest text-amber-400">arquivado</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-2 py-3 text-center text-hud">
          <Stat label="Abertas" value={open} />
          <Stat label="Hoje" value={dueToday} tone={dueToday > 0 ? "warn" : "neutral"} />
          <Stat label="Atrasadas" value={overdue} tone={overdue > 0 ? "alert" : "neutral"} />
        </CardContent>
      </Card>

      {/* Editar nome */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProjectAction} className="flex gap-2">
            <input type="hidden" name="id" value={project.id} />
            <Input name="name" defaultValue={project.name} required maxLength={60} className="flex-1" />
            <Button type="submit">Salvar</Button>
          </form>
          <div className="mt-3 flex gap-2">
            {project.archivedAt ? (
              <form action={unarchiveProjectAction} className="flex-1">
                <input type="hidden" name="id" value={project.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Desarquivar
                </Button>
              </form>
            ) : (
              <form action={archiveProjectAction} className="flex-1">
                <input type="hidden" name="id" value={project.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Arquivar
                </Button>
              </form>
            )}
            <DeleteProjectButton id={project.id} name={project.name} />
          </div>
        </CardContent>
      </Card>

      {/* Clientes vinculados (admin only) */}
      {session.user.role === "admin" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Clientes · {linkedClients.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {linkedClients.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">
                Vincule clientes em <Link href="/clientes" className="underline">/clientes</Link>.
              </p>
            ) : (
              linkedClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    {c.company && (
                      <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                        {c.company}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {c.status}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tarefas do projeto */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Tarefas abertas · {tasks.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              Sem tarefas abertas. Crie em{" "}
              <Link href={`/tarefas?project=${encodeURIComponent(project.name)}`} className="underline">
                /tarefas
              </Link>
              .
            </p>
          ) : (
            tasks.map((t) => <TaskCard key={t.id} task={t} projectOptions={projectOptions} />)
          )}
        </CardContent>
      </Card>
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
