"use client";

// Helpers pra rodar dentro do shell nativo (Capacitor).
// Tudo aqui e no-op quando o app roda no browser/PWA, entao pode ser
// chamado sem guard nos componentes compartilhados.

import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Feedback tatil. No nativo usa a Taptic Engine / vibrator; no browser
 * cai pro navigator.vibrate quando existe. Nunca lanca.
 */
export async function haptic(style: HapticStyle = "light"): Promise<void> {
  try {
    if (!isNative()) {
      navigator.vibrate?.(style === "heavy" ? 30 : 10);
      return;
    }
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success" || style === "warning" || style === "error") {
      const map = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      } as const;
      await Haptics.notification({ type: map[style] });
      return;
    }
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    } as const;
    await Haptics.impact({ style: map[style] });
  } catch {
    // sem haptics disponivel — ignora
  }
}
