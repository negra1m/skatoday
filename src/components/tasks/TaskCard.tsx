"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import type { Task } from "@/db/schema";
import { PRIORITY_DOT, PRIORITY_LABEL } from "@/lib/projects";
import { Checkbox } from "@/components/ui/checkbox";
import { SwipeCard } from "@/components/ui/swipe-card";
import { cn } from "@/lib/utils";
import { TaskModal } from "./TaskModal";
import {
  toggleTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/(app)/tarefas/actions";
import { invokeAction } from "@/lib/form-action";

export function TaskCard({ task, projectOptions = [] }: { task: Task; projectOptions?: string[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !!task.deadline && task.deadline < today && !task.done;
  const dueToday = task.deadline === today;
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <SwipeCard
        actions={[
          {
            type: "edit",
            onClick: () => setEditOpen(true),
          },
          {
            type: "delete",
            confirmMessage: "Deletar essa tarefa?",
            tone: "danger",
            onClick: async () => {
              await invokeAction(deleteTaskAction, { id: task.id });
              router.refresh();
            },
          },
        ]}
      >
        <div
          className={cn(
            "flex items-start gap-3 border border-border bg-card px-3 py-2.5",
            task.done && "opacity-50",
          )}
        >
          <form
            action={toggleTaskAction}
            className="pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="done" value={task.done ? "0" : "1"} />
            <button
              type="submit"
              aria-label={task.done ? "Desmarcar" : "Marcar como feita"}
              className="inline-flex"
            >
              <Checkbox checked={task.done} />
            </button>
          </form>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
              <p className={cn("text-sm leading-tight", task.done && "line-through")}>{task.title}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{task.project}</span>
              <span>{PRIORITY_LABEL[task.priority]}</span>
              {task.deadline && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    overdue && "text-red-400",
                    dueToday && "text-amber-400",
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {task.deadline}
                  {overdue && " · atrasada"}
                  {dueToday && " · hoje"}
                </span>
              )}
            </div>
            {task.notes && (
              <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
            )}
          </div>
        </div>
      </SwipeCard>

      {/* Modal controlado externo, aberto quando swipe-edit dispara */}
      {editOpen && (
        <TaskModal
          mode="edit"
          task={task}
          action={updateTaskAction}
          projectOptions={projectOptions}
          controlledOpen
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
