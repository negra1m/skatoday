"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SwipeAction = {
  type: "edit" | "delete" | "custom";
  onClick: () => void;
  confirmMessage?: string;
  label?: string;
  icon?: React.ReactNode;
  tone?: "danger" | "neutral";
};

type Props = {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
};

const ACTION_WIDTH = 64;
const TRIGGER_THRESHOLD = 32;

export function SwipeCard({ children, actions, className }: Props) {
  const [offset, setOffset] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const startX = React.useRef<number | null>(null);
  const lastX = React.useRef(0);
  const movedRef = React.useRef(false);

  const maxSwipe = actions.length * ACTION_WIDTH;
  const opened = offset <= -maxSwipe + 4;

  const close = React.useCallback(() => {
    setAnimating(true);
    setOffset(0);
  }, []);

  React.useEffect(() => {
    if (!opened) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-swipe-card]")) close();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [opened, close]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    lastX.current = offset;
    movedRef.current = false;
    setAnimating(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    if (Math.abs(delta) > 6) movedRef.current = true;
    const next = Math.min(0, Math.max(-maxSwipe - 20, lastX.current + delta));
    setOffset(next);
  };

  const onTouchEnd = () => {
    startX.current = null;
    setAnimating(true);
    if (offset < -TRIGGER_THRESHOLD) setOffset(-maxSwipe);
    else setOffset(0);
  };

  // Click no card fechado abre/fecha; com swipe ativo, click vira no-op
  const onCardClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      movedRef.current = false;
    }
  };

  return (
    <div
      data-swipe-card
      className={cn("relative overflow-hidden rounded-md", className)}
    >
      {/* Action layer (atrás) */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: maxSwipe }}
      >
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (a.confirmMessage && !confirm(a.confirmMessage)) {
                close();
                return;
              }
              a.onClick();
              close();
            }}
            aria-label={a.label ?? a.type}
            className={cn(
              "flex h-full items-center justify-center text-xs font-medium uppercase tracking-widest transition-colors",
              a.tone === "danger"
                ? "bg-red-500/90 text-white hover:bg-red-500"
                : "bg-secondary text-foreground hover:bg-muted",
            )}
            style={{ width: ACTION_WIDTH }}
          >
            {a.icon ?? (a.type === "delete" ? <Trash2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />)}
          </button>
        ))}
      </div>

      {/* Content layer (na frente) */}
      <div
        className={cn(
          "relative bg-card",
          animating && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={onCardClick}
        onTransitionEnd={() => setAnimating(false)}
      >
        {children}
      </div>
    </div>
  );
}
