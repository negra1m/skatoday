"use client";

import { useEffect } from "react";

/**
 * Registra o service worker e chama update() a cada navegação de página.
 * Renderiza null — apenas efeitos colaterais.
 */
export function SwRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Verifica update silenciosamente na carga inicial
        reg.update().catch(() => {});
      })
      .catch(() => {});
  }, []);

  return null;
}
