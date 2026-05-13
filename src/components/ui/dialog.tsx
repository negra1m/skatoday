"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};
const DialogCtx = React.createContext<DialogCtx | null>(null);

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultOpen ?? open ?? false);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internal;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternal(v);
    onOpenChange?.(v);
  };
  return <DialogCtx.Provider value={{ open: current, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
}) {
  const ctx = React.useContext(DialogCtx);
  if (!ctx) return null;
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      ctx.setOpen(true);
    },
  });
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DialogCtx);
  React.useEffect(() => {
    if (!ctx?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx.setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ctx?.open, ctx]);

  if (!ctx?.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) ctx.setOpen(false);
      }}
    >
      <div
        className={cn(
          "relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-2xl sm:rounded-2xl",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => ctx.setOpen(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-3 space-y-1", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-base font-semibold", className)}>{children}</h2>;
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}

export function useDialog() {
  const ctx = React.useContext(DialogCtx);
  if (!ctx) throw new Error("useDialog must be used inside Dialog");
  return ctx;
}
