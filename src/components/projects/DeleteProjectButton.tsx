"use client";

import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/app/(app)/projetos/actions";

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProjectAction}
      className="flex-1"
      onSubmit={(e) => {
        if (!confirm(`Deletar "${name}"? Tarefas mantêm o nome mas viram órfãs.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" className="w-full">
        Deletar
      </Button>
    </form>
  );
}
