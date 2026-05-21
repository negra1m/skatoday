import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_TZ = "America/Sao_Paulo";

/**
 * Retorna a data ISO (YYYY-MM-DD) no fuso indicado.
 * Sem fuso: usa America/Sao_Paulo (default Few). Container roda em UTC,
 * então NÃO use `new Date().toISOString().slice(0,10)` direto.
 */
export function todayISO(timezone: string = DEFAULT_TZ): string {
  return formatDateInTz(new Date(), timezone);
}

export function monthISO(d: Date = new Date(), timezone: string = DEFAULT_TZ): string {
  return formatDateInTz(d, timezone).slice(0, 7);
}

/** Formata um Date como YYYY-MM-DD no fuso indicado. */
export function formatDateInTz(date: Date, timezone: string = DEFAULT_TZ): string {
  // Intl é built-in e tem suporte completo a tz nomeadas (Node 22)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/** Lista de timezones úteis pra UI (subset comum). */
export const COMMON_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Rio_Branco",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Lagos",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
] as const;
