import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { hashPassword, issueSession } from "@/lib/auth";
import { getLocale, getT } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function signUp(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!username || !email || !password) redirect("/cadastrar?erro=invalido");
  if (password.length < 8) redirect("/cadastrar?erro=fraca");
  if (password !== password2) redirect("/cadastrar?erro=mismatch");
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) redirect("/cadastrar?erro=invalido");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/cadastrar?erro=invalido");

  const exists = db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.username, username), eq(schema.users.email, email)))
    .get();
  if (exists) redirect("/cadastrar?erro=exists");

  const passwordHash = await hashPassword(password);
  const isFirst = !db.select().from(schema.users).get();
  const tzRaw = String(formData.get("timezone") ?? "").trim();
  const timezone = tzRaw && /^[A-Za-z_/-]+$/.test(tzRaw) ? tzRaw : "America/Sao_Paulo";
  const user = db
    .insert(schema.users)
    .values({
      username,
      email,
      passwordHash,
      role: isFirst ? "admin" : "user",
      timezone,
    })
    .returning()
    .get();

  db.insert(schema.profiles)
    .values({ userId: user.id, name: username })
    .run();

  await issueSession(user.id);
  redirect("/");
}

export default async function CadastrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const locale = await getLocale();
  const t = await getT();

  const erroMsg =
    erro === "exists"
      ? t("auth.exists")
      : erro === "fraca"
        ? t("auth.weak")
        : erro === "mismatch"
          ? t("auth.mismatch")
          : erro === "invalido"
            ? t("auth.invalid")
            : null;

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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.signup")}</p>
        </header>

        <form action={signUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input
              id="username"
              name="username"
              autoFocus
              required
              autoComplete="username"
              spellCheck={false}
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
              className="text-hud text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password2">{t("auth.password_confirm")}</Label>
            <Input
              id="password2"
              name="password2"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          {/* Timezone auto-detect (preenchido por client script) */}
          <input type="hidden" id="timezone" name="timezone" defaultValue="America/Sao_Paulo" />
          <script
            dangerouslySetInnerHTML={{
              __html: `try{var el=document.getElementById('timezone');var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;if(el&&tz)el.value=tz;}catch(e){}`,
            }}
          />
          {erroMsg && <p className="text-xs text-destructive">{erroMsg}</p>}
          <Button type="submit" className="w-full">
            {t("auth.signup")}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/entrar" className="hover:text-foreground">
            {t("auth.have_account")}
          </Link>
        </p>
      </div>

      <footer className="mt-12 text-[10px] uppercase tracking-widest text-muted-foreground">
        {t("app.maker")}
      </footer>
    </main>
  );
}
