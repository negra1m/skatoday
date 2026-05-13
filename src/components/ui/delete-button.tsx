"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  id,
  message = "Deletar esse registro?",
  size = "sm",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  message?: string;
  size?: "sm" | "md";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Deletar"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      </button>
    </form>
  );
}
