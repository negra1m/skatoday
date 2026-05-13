"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VoiceCapture } from "./VoiceCapture";
import { FEW_PROJECTS, PRIORITIES, PRIORITY_LABEL } from "@/lib/projects";
import type { Task } from "@/db/schema";

type Props = {
  mode: "create" | "edit";
  task?: Task;
  action: (formData: FormData) => Promise<void>;
  trigger?: React.ReactNode;
  defaultProject?: string;
  controlledOpen?: boolean;
  onClose?: () => void;
};

export function TaskModal({
  mode,
  task,
  action,
  trigger,
  defaultProject,
  controlledOpen,
  onClose,
}: Props) {
  const [open, setOpen] = React.useState(controlledOpen ?? false);
  const [title, setTitle] = React.useState(task?.title ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (controlledOpen !== undefined) setOpen(controlledOpen);
  }, [controlledOpen]);

  React.useEffect(() => {
    if (mode !== "create") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
          return;
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) onClose?.();
      }}
    >
      <DialogTrigger asChild>
        <span>
          {trigger ?? (
            <Button type="button">
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {mode === "create" ? "Nova tarefa" : "Editar"}
            </Button>
          )}
        </span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nova tarefa" : "Editar tarefa"}</DialogTitle>
        </DialogHeader>

        <form
          ref={formRef}
          action={async (fd) => {
            await action(fd);
            setOpen(false);
            setTitle("");
          }}
          className="space-y-3"
        >
          {mode === "edit" && task && <input type="hidden" name="id" value={task.id} />}

          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa fazer?"
            />
          </div>

          <VoiceCapture onTranscript={(t) => setTitle((prev) => (prev ? prev + " " + t : t))} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="project">Projeto</Label>
              <Select id="project" name="project" defaultValue={task?.project ?? defaultProject ?? "skatoday"}>
                {FEW_PROJECTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Prioridade</Label>
              <Select id="priority" name="priority" defaultValue={task?.priority ?? "next"}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="deadline">Prazo</Label>
            <Input id="deadline" name="deadline" type="date" defaultValue={task?.deadline ?? ""} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={task?.notes ?? ""} />
          </div>

          <Button type="submit" className="w-full">
            {mode === "create" ? "Criar" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
