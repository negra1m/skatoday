import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { listTricks } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import type { DictKey } from "@/lib/i18n/dict";
import type { Trick } from "@/db/schema";

const SECTIONS: Array<{ key: DictKey; status: Trick["status"] }> = [
  { key: "skate.section_arsenal", status: "arsenal" },
  { key: "skate.section_na_base", status: "na_base" },
  { key: "skate.section_quase", status: "quase" },
  { key: "skate.section_aprendendo", status: "aprendendo" },
  { key: "skate.section_descobrindo", status: "descobrindo" },
  { key: "skate.section_pausada", status: "pausada" },
];

export default async function ArsenalPage() {
  const session = (await getCurrentSession())!;
  const t = await getT();
  const tricks = listTricks(session.profile.id);
  const byStatus = new Map<Trick["status"], Trick[]>();
  for (const s of SECTIONS) byStatus.set(s.status, []);
  for (const tr of tricks) byStatus.get(tr.status)?.push(tr);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-hud text-2xl font-semibold">{t("skate.arsenal_title")}</h1>
        <Link
          href="/skate/sessao"
          className="rounded-md border border-input px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-accent"
        >
          {t("skate.new_session_short")}
        </Link>
      </header>

      <Link
        href="/skate/nova-trick"
        className="block rounded-md border border-dashed border-border px-3 py-2 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        {t("skate.new_trick")}
      </Link>

      {SECTIONS.map((s) => {
        const items = byStatus.get(s.status) ?? [];
        if (items.length === 0) return null;
        return (
          <Card key={s.status}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm uppercase tracking-widest">
                <span>{t(s.key)}</span>
                <span className="text-muted-foreground">{items.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((tr) => (
                <Link
                  key={tr.id}
                  href={`/skate/trick/${tr.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <div className="text-sm font-medium">{tr.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {tr.category} · {tr.stance} · lvl {tr.level}
                    </div>
                  </div>
                  <div className="text-hud text-xs tabular-nums text-muted-foreground">{tr.totalXp}xp</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
