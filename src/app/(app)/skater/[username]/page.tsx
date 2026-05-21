import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Flame, ListChecks, Trophy } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import {
  areFriends,
  findUserByUsername,
  getFriendshipBetween,
  getProfileByUserId,
} from "@/db/friends";
import {
  listSessionsInMonth,
  listSessionTricksByMonth,
  listTricks,
} from "@/db/queries";
import { computeStreak } from "@/lib/xp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StreakMap } from "@/components/hud/StreakMap";
import { sendFriendRequestAction } from "../../amigos/actions";
import { todayISO } from "@/lib/utils";

export default async function SkaterPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const s = (await getCurrentSession())!;
  const { username } = await params;
  const target = findUserByUsername(decodeURIComponent(username));
  if (!target) notFound();

  const isSelf = target.id === s.user.id;
  const friendship = isSelf ? null : getFriendshipBetween(s.user.id, target.id);
  const accepted = isSelf || friendship?.status === "accepted";

  if (!accepted) {
    // Não-amigos veem só uma versão muito reduzida: nome + botão de adicionar
    const profile = getProfileByUserId(target.id);
    const pendingRequest = friendship?.status === "pending";
    const sentByMe = pendingRequest && friendship?.requesterId === s.user.id;

    return (
      <div className="space-y-4">
        <Link href="/amigos" className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ← Amigos
        </Link>
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <h1 className="text-hud text-2xl font-semibold">@{target.username}</h1>
            {profile?.name && (
              <p className="text-sm text-muted-foreground">{profile.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Adicione como amigo pra ver a ficha de skate.
            </p>
            {pendingRequest ? (
              <p className="text-[10px] uppercase tracking-widest text-amber-400">
                {sentByMe ? "pedido enviado" : "este usuário te enviou pedido — confirme em /amigos"}
              </p>
            ) : (
              <form action={sendFriendRequestAction}>
                <input type="hidden" name="addresseeId" value={target.id} />
                <Button type="submit" className="w-full">
                  Adicionar como amigo
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Amigos OU self: ficha completa
  const profile = getProfileByUserId(target.id);
  if (!profile) notFound();

  const tricks = listTricks(profile.id);
  const totalXp = tricks.reduce((a, t) => a + t.totalXp, 0);
  const naBase = tricks.filter((t) => t.status === "na_base" || t.status === "arsenal").length;
  const arsenal = tricks.filter((t) => t.status === "arsenal").length;

  const today = todayISO();
  const [yyyy, mm] = today.split("-").map(Number);
  const monthSessions = listSessionsInMonth(profile.id, today.slice(0, 7));
  const streak = computeStreak(monthSessions.map((m) => m.date));
  const tricksByDate = listSessionTricksByMonth(profile.id, today.slice(0, 7));
  const cells = monthSessions.map((m) => {
    const dur = m.durationMinutes ?? 0;
    const intensity = (dur >= 90 ? 4 : dur >= 60 ? 3 : dur >= 30 ? 2 : 1) as 0 | 1 | 2 | 3 | 4;
    return { date: m.date, intensity, tricksCount: tricksByDate.get(m.date) ?? 0 };
  });

  return (
    <div className="space-y-4">
      {!isSelf && (
        <Link href="/amigos" className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ← Amigos
        </Link>
      )}

      <Card>
        <CardContent className="space-y-1 pt-5 pb-4 text-center">
          <h1 className="text-hud text-2xl font-semibold neon-glow">@{target.username}</h1>
          {profile.name && profile.name !== target.username && (
            <p className="text-sm text-muted-foreground">{profile.name}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 text-hud">
        <Stat icon={Trophy} label="XP total" value={String(totalXp)} />
        <Stat icon={Flame} label="Streak" value={`${streak}d`} />
        <Stat icon={Activity} label="Sessões/mês" value={String(monthSessions.length)} />
        <Stat icon={ListChecks} label="Na base / Arsenal" value={`${naBase} / ${arsenal}`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {today.slice(0, 7)} — {monthSessions.length}{" "}
            {monthSessions.length === 1 ? "sessão" : "sessões"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreakMap cells={cells} year={yyyy} month={mm} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <span className="mt-0.5 text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
