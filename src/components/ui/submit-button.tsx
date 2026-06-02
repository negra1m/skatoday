"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botão de submit que se desabilita enquanto o form está pending.
 * Resolve o problema de double-submit (gera 2 requests, sendo a 2ª "user already exists").
 *
 * Uso: trocar `<Button type="submit" ...>` por `<SubmitButton ...>` dentro do form.
 */
type Props = ButtonProps & {
  pendingLabel?: string;
  children: React.ReactNode;
};

export function SubmitButton({ pendingLabel, children, className, disabled, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-busy={pending}
      disabled={pending || disabled}
      className={cn(pending && "cursor-not-allowed opacity-70", className)}
      {...rest}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
