"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isNative, nativePlatform } from "@/lib/native";

// Rotas raiz da BottomNav (uniao das variantes admin e comum): apertar
// voltar aqui fecha o app em vez de navegar pra tras no historico.
const ROOT_ROUTES = [
  "/",
  "/tarefas",
  "/skate",
  "/clientes",
  "/projetos",
  "/eu",
];

/**
 * Liga o app web ao shell nativo: status bar, splash, botao voltar do
 * Android e uma classe no <html> pra CSS condicional.
 * Renderiza null — so tem efeitos colaterais.
 */
export function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();

  // Setup unico: status bar, splash e marcacao no DOM.
  useEffect(() => {
    if (!isNative()) return;

    const platform = nativePlatform();
    document.documentElement.classList.add("is-native", `is-${platform}`);

    let cancelled = false;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        await StatusBar.setStyle({ style: Style.Dark });
        if (platform === "android") {
          await StatusBar.setBackgroundColor({ color: "#0a0a0b" });
        }
      } catch {
        // status bar indisponivel — segue
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (cancelled) return;
        await SplashScreen.hide();
      } catch {
        // splash ja escondida — segue
      }
    })();

    return () => {
      cancelled = true;
      document.documentElement.classList.remove("is-native", `is-${platform}`);
    };
  }, []);

  // Botao voltar do Android. Reassina a cada rota porque o handler
  // precisa enxergar o pathname atual.
  useEffect(() => {
    if (!isNative() || nativePlatform() !== "android") return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (ROOT_ROUTES.includes(pathname) || !canGoBack) {
          App.exitApp();
          return;
        }
        router.back();
      });
      if (cancelled) {
        handle.remove();
        return;
      }
      remove = () => handle.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [pathname, router]);

  return null;
}
