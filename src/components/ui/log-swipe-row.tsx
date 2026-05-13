"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SwipeCard } from "./swipe-card";
import { invokeAction } from "@/lib/form-action";

type Props = {
  id: string;
  editHref?: string;
  deleteAction: (formData: FormData) => Promise<void>;
  confirmMessage?: string;
  children: React.ReactNode;
};

export function LogSwipeRow({
  id,
  editHref,
  deleteAction,
  confirmMessage = "Deletar esse registro?",
  children,
}: Props) {
  const router = useRouter();
  const actions = [
    ...(editHref
      ? [
          {
            type: "edit" as const,
            onClick: () => router.push(editHref),
          },
        ]
      : []),
    {
      type: "delete" as const,
      tone: "danger" as const,
      confirmMessage,
      onClick: async () => {
        await invokeAction(deleteAction, { id });
        router.refresh();
      },
    },
  ];
  return <SwipeCard actions={actions}>{children}</SwipeCard>;
}
