"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Briefcase, Home, ListChecks, FolderKanban, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavLabels = {
  hud: string;
  tasks: string;
  skate: string;
  projects: string;
  me: string;
  clients: string;
};

const DEFAULT_LABELS: NavLabels = {
  hud: "HUD",
  tasks: "Tarefas",
  skate: "Skate",
  projects: "Projetos",
  me: "Eu",
  clients: "Clientes",
};

export function BottomNav({
  isAdmin = false,
  labels = DEFAULT_LABELS,
}: {
  isAdmin?: boolean;
  labels?: NavLabels;
}) {
  const path = usePathname();
  const items = isAdmin
    ? [
        { href: "/", icon: Home, label: labels.hud },
        { href: "/tarefas", icon: ListChecks, label: labels.tasks },
        { href: "/clientes", icon: Briefcase, label: labels.clients },
        { href: "/projetos", icon: FolderKanban, label: labels.projects },
        { href: "/eu", icon: User, label: labels.me },
      ]
    : [
        { href: "/", icon: Home, label: labels.hud },
        { href: "/tarefas", icon: ListChecks, label: labels.tasks },
        { href: "/skate", icon: Activity, label: labels.skate },
        { href: "/projetos", icon: FolderKanban, label: labels.projects },
        { href: "/eu", icon: User, label: labels.me },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 text-[10px] uppercase tracking-wider transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full"
                    style={{
                      background: "var(--neon-gradient)",
                      boxShadow: "0 0 10px hsl(var(--neon-purple) / 0.6)",
                    }}
                  />
                )}
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_4px_hsl(var(--neon-purple)/0.7)]")} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
