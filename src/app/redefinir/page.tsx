import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { consumeResetToken, hashPassword, markResetUsed } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function submitReset(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  if (!token || password.length < 8 || password !== password2) {
    redirect(`/redefinir?token=${encodeURIComponent(token)}&erro=invalido`);
  }
  const row = consumeResetToken(token);
  if (!row) redirect("/redefinir?erro=expirado");
  const passwordHash = await hashPassword(password);
  db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, row.userId)).run();
  markResetUsed(row.id);
  redirect("/entrar?reset=ok");
}

export default async function RedefinirPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; erro?: string }>;
}) {
  const { token, erro } = await searchParams;
  const t = await getT();
  const invalid = !token || erro === "expirado";

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3rem)" }}
    >
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-1 text-center">
          <h1 className="text-hud text-2xl font-semibold tracking-wider">{t("auth.reset.title")}</h1>
        </header>

        {invalid ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm">
            {t("auth.reset.invalid")}
            <div className="mt-3">
              <Link href="/esqueci-senha" className="text-xs underline">
                {t("auth.forgot")}
              </Link>
            </div>
          </div>
        ) : (
          <form action={submitReset} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.reset.new")}</Label>
              <Input id="password" name="password" type="password" required minLength={8} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">{t("auth.reset.confirm")}</Label>
              <Input id="password2" name="password2" type="password" required minLength={8} />
            </div>
            {erro === "invalido" && (
              <p className="text-xs text-destructive">
                {t("auth.weak")} / {t("auth.mismatch")}
              </p>
            )}
            <Button type="submit" className="w-full">
              {t("common.save")}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
