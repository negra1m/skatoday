"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_FLAG, LOCALE_LABEL, type Locale } from "@/lib/i18n/dict";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <select
      value={current}
      onChange={async (e) => {
        const v = e.target.value;
        await fetch("/api/locale", {
          method: "POST",
          body: JSON.stringify({ locale: v }),
          headers: { "Content-Type": "application/json" },
        });
        startTransition(() => router.refresh());
      }}
      className="h-8 appearance-none rounded-md border border-input bg-secondary px-2 text-xs text-foreground"
      aria-label="Idioma"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_FLAG[l]} {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
