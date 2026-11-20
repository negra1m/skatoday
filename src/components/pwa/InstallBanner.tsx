"use client";

import { useEffect, useState } from "react";

// Tipagem mínima do evento que o Chrome dispara
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Já foi dispensado pelo usuário antes
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar skatoday"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 2rem)",
        maxWidth: "26rem",
        zIndex: 9999,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "0.75rem",
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        boxShadow: "0 4px 24px hsl(0 0% 0% / 0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={32} height={32} style={{ borderRadius: "0.375rem" }} />
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, margin: 0 }}>skatoday</p>
          <p style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", margin: 0 }}>
            Instalar no celular
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{
            fontSize: "0.7rem",
            padding: "0.3rem 0.6rem",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.4rem",
            background: "transparent",
            color: "hsl(var(--muted-foreground))",
            cursor: "pointer",
          }}
        >
          Agora não
        </button>
        <button
          onClick={handleInstall}
          style={{
            fontSize: "0.7rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "0.4rem",
            border: "none",
            background: "hsl(var(--neon-purple, 270 70% 55%))",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Instalar
        </button>
      </div>
    </div>
  );
}
