import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentUser, issueSession, verifyPassword } from "@/lib/auth";
import { getLocale, getT } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCALE_FLAG } from "@/lib/i18n/dict";

async function signIn(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) redirect("/entrar?erro=invalido");
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .get();
  if (!user || !user.active) redirect("/entrar?erro=invalido");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) redirect("/entrar?erro=invalido");
  db.update(schema.users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(schema.users.id, user.id))
    .run();
  await issueSession(user.id);
  redirect("/");
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const existing = await getCurrentUser();
  if (existing) redirect("/");
  const { erro } = await searchParams;
  const locale = await getLocale();
  const t = await getT();

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
    >
      <div
        className="absolute right-4"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <LocaleSwitcher current={locale} />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-hud text-3xl font-semibold tracking-wider neon-glow">{t("app.title")}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("app.tagline")}</p>
        </header>

        <form action={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input
              id="username"
              name="username"
              autoFocus
              required
              autoComplete="username"
              spellCheck={false}
              className="text-hud text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="text-hud text-base"
            />
          </div>
          {erro === "invalido" && <p className="text-xs text-destructive">{t("auth.invalid")}</p>}
          <Button type="submit" className="w-full">
            {t("auth.signin")}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <Link href="/esqueci-senha" className="text-muted-foreground hover:text-foreground">
            {t("auth.forgot")}
          </Link>
          <Link href="/cadastrar" className="text-muted-foreground hover:text-foreground">
            {t("auth.signup")}
          </Link>
        </div>
      </div>

      <footer className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-base leading-none">{LOCALE_FLAG["pt-BR"]}</span>
        <span>{t("app.maker")}</span>
      </footer>
    </main>
  );
}
