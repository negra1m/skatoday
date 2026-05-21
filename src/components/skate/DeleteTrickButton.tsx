"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTrickAction } from "@/app/(app)/actions";

export function DeleteTrickButton({
  id,
  name,
  historyCount,
}: {
  id: string;
  name: string;
  historyCount: number;
}) {
  return (
    <form
      action={deleteTrickAction}
      onSubmit={(e) => {
        const msg =
          historyCount > 0
            ? `Deletar "${name}"? Vai apagar ${historyCount} registro${historyCount > 1 ? "s" : ""} de sessões com essa trick. Sem volta.`
            : `Deletar "${name}"? Sem volta.`;
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" className="w-full">
        <Trash2 className="h-4 w-4" />
        Deletar trick
      </Button>
    </form>
  );
}
