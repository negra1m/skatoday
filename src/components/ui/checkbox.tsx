"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  id,
}: CheckboxProps) {
  const [internal, setInternal] = React.useState(defaultChecked ?? checked ?? false);
  const isControlled = checked !== undefined;
  const current = isControlled ? checked : internal;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={current}
      disabled={disabled}
      id={id}
      onClick={(e) => {
        e.stopPropagation();
        const next = !current;
        if (!isControlled) setInternal(next);
        onCheckedChange?.(next);
      }}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-input transition-colors",
        current ? "bg-primary text-primary-foreground" : "bg-secondary",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {current && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
