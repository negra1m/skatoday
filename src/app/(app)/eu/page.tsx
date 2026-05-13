import Link from "next/link";
import { Dumbbell, Footprints, Swords, ListChecks } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { latestBodyLog, listRuns, listJiu } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EuPage() {
  const s = (await getCurrentSession())!;
  const body = latestBodyLog(s.profile.id);
  const runs = listRuns(s.profile.id);
  const jiu = listJiu(s.profile.id);

  const sections = [
    {
      href: "/corpo",
      icon: Dumbbell,
      label: "Corpo",
      hint: body ? `${body.weightKg ?? "—"}kg · ${body.date}` : "Sem logs ainda",
    },
    {
      href: "/corrida",
      icon: Footprints,
      label: "Corrida",
      hint: runs[0] ? `${runs[0].distanceKm}km · ${runs[0].date}` : "Sem corridas ainda",
    },
    {
      href: "/jiu",
      icon: Swords,
      label: "Jiu",
      hint: jiu[0] ? `${jiu[0].durationMinutes}min · ${jiu[0].date}` : "Sem treinos ainda",
    },
    {
      href: "/rotina",
      icon: ListChecks,
      label: "Rotina do dia",
      hint: "Tarefas da casa + treino",
    },
  ];

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
