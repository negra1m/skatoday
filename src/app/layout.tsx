import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FEW_WATERMARK } from "@/lib/watermark";

export const metadata: Metadata = {
  title: `skatoday${FEW_WATERMARK}`,
  description: "HUD pessoal de skate, corpo e rotina",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "skatoday",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
