import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { listTricks } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Trick } from "@/db/schema";

const SECTIONS: Array<{ title: string; status: Trick["status"] }> = [
  { title: "Arsenal", status: "arsenal" },
  { title: "Na base", status: "na_base" },
  { title: "Quase", status: "quase" },
  { title: "Aprendendo", status: "aprendendo" },
  { title: "Descobrindo", status: "descobrindo" },
  { title: "Pausadas", status: "pausada" },
];

export default async function ArsenalPage() {
  const session = (await getCurrentSession())!;
  const tricks = listTricks(session.profile.id);
  const byStatus = new Map<Trick["status"], Trick[]>();
  for (const s of SECTIONS) byStatus.set(s.status, []);
  for (const t of tricks) byStatus.get(t.status)?.push(t);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-hud text-2xl font-semibold">Arsenal</h1>
        <Link
          href="/skate/sessao"
          className="rounded-md border border-input px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-accent"
        >
          + sessão
        </Link>
      </header>

      <Link
        href="/skate/nova-trick"
        className="block rounded-md border border-dashed border-border px-3 py-2 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        + nova trick
      </Link>

      {SECTIONS.map((s) => {
        const items = byStatus.get(s.status) ?? [];
        if (items.length === 0) return null;
        return (
          <Card key={s.status}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm uppercase tracking-widest">
                <span>{s.title}</span>
                <span className="text-muted-foreground">{items.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/skate/trick/${t.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t.category} · {t.stance} · lvl {t.level}
                    </div>
                  </div>
                  <div className="text-hud text-xs tabular-nums text-muted-foreground">{t.totalXp}xp</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
