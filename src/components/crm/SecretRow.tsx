"use client";

import * as React from "react";
import { Eye, EyeOff, Copy, ExternalLink } from "lucide-react";
import type { ClientSecret } from "@/db/schema";
import { revealSecretAction, deleteSecretAction } from "@/app/(app)/clientes/actions";
import { DeleteButton } from "@/components/ui/delete-button";

export function SecretRow({
  secret,
  clientId,
}: {
  secret: ClientSecret;
  clientId: string;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  const [revealed, setRevealed] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function toggle() {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    try {
      const v = await revealSecretAction(secret.id);
      setRevealed(v ?? "");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    let value = revealed;
    if (value === null) {
      const v = await revealSecretAction(secret.id);
      value = v ?? "";
    }
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{secret.label}</p>
          {secret.username && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {secret.username}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={toggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-label={revealed !== null ? "Ocultar" : "Revelar"}
          >
            {revealed !== null ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={copy}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-label="Copiar"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {secret.url && (
            <a
              href={secret.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <DeleteButton
            action={deleteSecretAction}
            id={secret.id}
            message="Deletar essa credencial?"
            extraFields={{ clientId }}
          />
        </div>
      </div>
      {revealed !== null && (
        <p className="font-mono text-xs break-all rounded bg-muted/40 px-2 py-1.5">
          {loading ? "..." : revealed || "(erro)"}
        </p>
      )}
      {copied && <p className="text-[10px] text-emerald-400">Copiado!</p>}
      {secret.notes && <p className="text-[10px] text-muted-foreground">{secret.notes}</p>}
    </div>
  );
}
