"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
};
const TabsCtx = React.createContext<TabsCtx | null>(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? value ?? "");
  const current = value ?? internal;
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsCtx.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all",
        active ? "bg-background text-foreground shadow" : "hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) return null;
  if (ctx.value !== value) return null;
  return <div className={cn("mt-3", className)}>{children}</div>;
}
