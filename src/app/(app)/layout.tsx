import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { BottomNav } from "@/components/hud/BottomNav";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { getLocale, getT } from "@/lib/i18n/server";

async function logout() {
  "use server";
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  const { redirect } = await import("next/navigation");
  redirect("/entrar");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/entrar");
  const locale = await getLocale();
  const t = await getT();

  return (
    <div className="mx-auto max-w-md min-h-screen pb-20">
      <header
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("app.title")}</p>
          <p className="text-hud text-sm">{session.user.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <form action={logout}>
            <button
              type="submit"
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {t("common.logout")}
            </button>
          </form>
        </div>
      </header>
      <div className="px-4 pb-6">{children}</div>
      <BottomNav isAdmin={session.user.role === "admin"} />
      <footer className="fixed bottom-16 left-0 right-0 z-10 pointer-events-none flex justify-center pb-1">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur">
          <span>skatoday</span>
        </div>
      </footer>
    </div>
  );
}
