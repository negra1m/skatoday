import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { createResetRequest } from "@/lib/auth";
import { buildResetEmail, sendMail } from "@/lib/mail";
import { getLocale, getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function requestReset(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!username || !email) redirect("/esqueci-senha?sent=1");

  // Tempo constante: sempre faz a lookup mesmo se for inválido
  const user = db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.username, username),
        eq(schema.users.email, email),
        eq(schema.users.active, true),
      ),
    )
    .get();

  if (user) {
    const token = createResetRequest(user.id);
    const base = process.env.PUBLIC_BASE_URL ?? "https://agenda.fewcompany.com";
    const resetUrl = `${base}/redefinir?token=${token}`;
    const email = buildResetEmail({
      username: user.username,
      resetUrl,
      locale: user.locale,
    });
    await sendMail({ to: user.email, ...email });
  }

  redirect("/esqueci-senha?sent=1");
}

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const t = await getT();
  await getLocale();

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
    >
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-1 text-center">
          <h1 className="text-hud text-2xl font-semibold tracking-wider">{t("auth.reset.title")}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.reset.hint")}</p>
        </header>

        {sent === "1" ? (
          <div className="rounded-md border border-border bg-secondary p-4 text-center text-sm">
            {t("auth.reset.sent")}
          </div>
        ) : (
          <form action={requestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input id="username" name="username" autoFocus required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full">
              {t("auth.reset.title")}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/entrar" className="hover:text-foreground">
            ← {t("auth.signin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
