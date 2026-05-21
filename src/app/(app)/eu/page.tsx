import Link from "next/link";
import { Dumbbell, Footprints, Swords, ListChecks, Activity, Droplet, Users } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { latestBodyLog, listRuns, listJiu } from "@/db/queries";
import { getEffectiveGoalMl, getWaterLogForDate } from "@/db/water";
import { listFriends, listPendingIncoming } from "@/db/friends";
import { Card, CardContent } from "@/components/ui/card";

export default async function EuPage() {
  const s = (await getCurrentSession())!;
  const isAdmin = s.user.role === "admin";
  const body = latestBodyLog(s.profile.id);
  const runs = listRuns(s.profile.id);
  const jiu = isAdmin ? listJiu(s.profile.id) : [];
  const today = new Date().toISOString().slice(0, 10);
  const waterGoalMl = getEffectiveGoalMl(s.profile.id);
  const waterLog = getWaterLogForDate(s.profile.id, today);
  const waterPct = Math.min(100, Math.round(((waterLog?.mlDrunk ?? 0) / waterGoalMl) * 100));

  const sections: Array<{ href: string; icon: typeof Dumbbell; label: string; hint: string }> = [];

  // Pro admin, Skate fica acessível via /eu (não está no BottomNav admin)
  if (isAdmin) {
    sections.push({
      href: "/skate",
      icon: Activity,
      label: "Skate",
      hint: "Arsenal · Sessão · Tricks",
    });
  }

  sections.push(
    {
      href: "/corpo",
      icon: Dumbbell,
      label: "Corpo",
      hint: body ? `${body.weightKg ?? "—"}kg · ${body.date}` : "Sem logs ainda",
    },
    {
      href: "/agua",
      icon: Droplet,
      label: "Água",
      hint: `${((waterLog?.mlDrunk ?? 0) / 1000).toFixed(2)}L / ${(waterGoalMl / 1000).toFixed(1)}L · ${waterPct}%`,
    },
    {
      href: "/corrida",
      icon: Footprints,
      label: "Corrida",
      hint: runs[0] ? `${runs[0].distanceKm}km · ${runs[0].date}` : "Sem corridas ainda",
    },
  );

  if (isAdmin) {
    sections.push({
      href: "/jiu",
      icon: Swords,
      label: "Jiu",
      hint: jiu[0] ? `${jiu[0].durationMinutes}min · ${jiu[0].date}` : "Sem treinos ainda",
    });
  }

  sections.push({
    href: "/rotina",
    icon: ListChecks,
    label: "Rotina do dia",
    hint: "Tarefas da casa + treino",
  });

  const friends = listFriends(s.user.id);
  const pending = listPendingIncoming(s.user.id);
  sections.push({
    href: "/amigos",
    icon: Users,
    label: "Amigos",
    hint:
      pending.length > 0
        ? `${friends.length} amigos · ${pending.length} pedido${pending.length > 1 ? "s" : ""} pendente${pending.length > 1 ? "s" : ""}`
        : friends.length === 0
          ? "Adicione amigos e veja a ficha deles"
          : `${friends.length} ${friends.length === 1 ? "amigo" : "amigos"}`,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Eu</h1>
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
