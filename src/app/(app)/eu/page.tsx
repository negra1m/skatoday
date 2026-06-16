import Link from "next/link";
import { Dumbbell, Footprints, Swords, ListChecks, Activity, Droplet, Users, User } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { latestBodyLog, listRuns, listJiu } from "@/db/queries";
import { getEffectiveGoalMl, getWaterLogForDate } from "@/db/water";
import { listFriends, listPendingIncoming } from "@/db/friends";
import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";

export default async function EuPage() {
  const s = (await getCurrentSession())!;
  const t = await getT();
  const isAdmin = s.user.role === "admin";
  const body = latestBodyLog(s.profile.id);
  const runs = listRuns(s.profile.id);
  const jiu = isAdmin ? listJiu(s.profile.id) : [];
  const today = new Date().toISOString().slice(0, 10);
  const waterGoalMl = getEffectiveGoalMl(s.profile.id);
  const waterLog = getWaterLogForDate(s.profile.id, today);
  const waterPct = Math.min(100, Math.round(((waterLog?.mlDrunk ?? 0) / waterGoalMl) * 100));

  const sections: Array<{ href: string; icon: typeof Dumbbell; label: string; hint: string }> = [];

  sections.push({
    href: `/skater/${encodeURIComponent(s.user.username)}`,
    icon: User,
    label: t("eu.my_card"),
    hint: t("eu.my_card_hint"),
  });

  // Pro admin, Skate fica acessível via /eu (não está no BottomNav admin)
  if (isAdmin) {
    sections.push({
      href: "/skate",
      icon: Activity,
      label: t("eu.skate"),
      hint: t("eu.skate_hint"),
    });
  }

  sections.push(
    {
      href: "/corpo",
      icon: Dumbbell,
      label: t("eu.body"),
      hint: body ? `${body.weightKg ?? "—"}kg · ${body.date}` : t("eu.body_empty"),
    },
    {
      href: "/agua",
      icon: Droplet,
      label: t("eu.water"),
      hint: `${((waterLog?.mlDrunk ?? 0) / 1000).toFixed(2)}L / ${(waterGoalMl / 1000).toFixed(1)}L · ${waterPct}%`,
    },
    {
      href: "/corrida",
      icon: Footprints,
      label: t("eu.run"),
      hint: runs[0] ? `${runs[0].distanceKm}km · ${runs[0].date}` : t("eu.run_empty"),
    },
  );

  if (isAdmin) {
    sections.push({
      href: "/jiu",
      icon: Swords,
      label: t("eu.jiu"),
      hint: jiu[0] ? `${jiu[0].durationMinutes}min · ${jiu[0].date}` : t("eu.jiu_empty"),
    });
  }

  sections.push({
    href: "/rotina",
    icon: ListChecks,
    label: t("eu.routine"),
    hint: t("eu.routine_hint"),
  });

  const bros = listFriends(s.user.id);
  const pending = listPendingIncoming(s.user.id);
  sections.push({
    href: "/bros",
    icon: Users,
    label: t("bros.title"),
    hint:
      pending.length > 0
        ? `${bros.length} ${t("bros.count").toLowerCase()} · ${pending.length} ${t("common.pending").toLowerCase()}`
        : bros.length === 0
          ? t("bros.hint_card_default")
          : `${bros.length} ${bros.length === 1 ? "bro" : "bros"}`,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">{t("eu.title")}</h1>
      <div className="space-y-3">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link key={sec.href} href={sec.href} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-3 py-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sec.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {sec.hint}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
