import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, Flame, ListChecks, Trophy } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import {
  areFriends,
  findUserByUsername,
  getFriendshipBetween,
  getProfileByUserId,
} from "@/db/friends";
import {
  listSessionsInMonth,
  listSessionsSince,
  listSessionTricksByMonth,
  listTricks,
} from "@/db/queries";
import { computeStreak } from "@/lib/xp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StreakMap } from "@/components/hud/StreakMap";
import { sendFriendRequestAction } from "../../bros/actions";
import { todayISO } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { tf } from "@/lib/i18n/dict";

const YM_RE = /^\d{4}-\d{2}$/;

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function SkaterPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const s = (await getCurrentSession())!;
  const t = await getT();
  const { username } = await params;
  const sp = await searchParams;
  const target = findUserByUsername(decodeURIComponent(username));
  if (!target) notFound();

  const isSelf = target.id === s.user.id;
  const friendship = isSelf ? null : getFriendshipBetween(s.user.id, target.id);
  const accepted = isSelf || friendship?.status === "accepted";

  if (!accepted) {
    // Não-bros veem só uma versão muito reduzida: nome + botão de adicionar
    const profile = getProfileByUserId(target.id);
    const pendingRequest = friendship?.status === "pending";
    const sentByMe = pendingRequest && friendship?.requesterId === s.user.id;

    return (
      <div className="space-y-4">
        <Link href="/bros" className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ← {t("bros.title")}
        </Link>
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <h1 className="text-hud text-2xl font-semibold">@{target.username}</h1>
            {profile?.name && (
              <p className="text-sm text-muted-foreground">{profile.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("bros.add_to_see_card")}
            </p>
            {pendingRequest ? (
              <p className="text-[10px] uppercase tracking-widest text-amber-400">
                {sentByMe ? t("bros.request_sent_short") : t("bros.request_received_short")}
              </p>
            ) : (
              <form action={sendFriendRequestAction}>
                <input type="hidden" name="addresseeId" value={target.id} />
                <Button type="submit" className="w-full">
                  {t("bros.add_as_bro")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bros OU self: ficha completa
  const profile = getProfileByUserId(target.id);
  if (!profile) notFound();

  const tricks = listTricks(profile.id);
  const totalXp = tricks.reduce((a, t) => a + t.totalXp, 0);
  const naBase = tricks.filter((t) => t.status === "na_base" || t.status === "arsenal").length;
  const arsenal = tricks.filter((t) => t.status === "arsenal").length;

  const today = todayISO();
  const currentYm = today.slice(0, 7);
  const ymParam = sp.m && YM_RE.test(sp.m) ? sp.m : currentYm;
  const ym = ymParam > currentYm ? currentYm : ymParam;
  const [yyyy, mm] = ym.split("-").map(Number);
  const monthSessions = listSessionsInMonth(profile.id, ym);

  // Streak sempre baseado nos últimos 90 dias até hoje, independente do mês visualizado.
  const streakStart = new Date();
  streakStart.setUTCDate(streakStart.getUTCDate() - 90);
  const recentSessions = listSessionsSince(profile.id, streakStart.toISOString().slice(0, 10));
  const streak = computeStreak(recentSessions.map((m) => m.date));

  const tricksByDate = listSessionTricksByMonth(profile.id, ym);
  const cells = monthSessions.map((m) => {
    const dur = m.durationMinutes ?? 0;
    const intensity = (dur >= 90 ? 4 : dur >= 60 ? 3 : dur >= 30 ? 2 : 1) as 0 | 1 | 2 | 3 | 4;
    return { date: m.date, intensity, tricksCount: tricksByDate.get(m.date) ?? 0 };
  });

  const prevYm = shiftMonth(ym, -1);
  const nextYm = shiftMonth(ym, 1);
  const canGoNext = nextYm <= currentYm;
  const baseHref = `/skater/${encodeURIComponent(target.username)}`;

  return (
    <div className="space-y-4">
      {!isSelf && (
        <Link href="/bros" className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ← {t("bros.title")}
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
        <Stat icon={Trophy} label={t("skater.xp_total")} value={String(totalXp)} />
        <Stat icon={Flame} label={t("skater.streak")} value={`${streak}d`} />
        <Stat icon={Activity} label={t("skater.month_sessions")} value={String(monthSessions.length)} />
        <Stat icon={ListChecks} label={t("skater.base_arsenal")} value={`${naBase} / ${arsenal}`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <Link
              href={`${baseHref}?m=${prevYm}`}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={prevYm}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-center">
              {tf(
                monthSessions.length === 1
                  ? t("skater.month_sessions_one")
                  : t("skater.month_sessions_other"),
                { month: ym, n: monthSessions.length },
              )}
            </span>
            {canGoNext ? (
              <Link
                href={`${baseHref}?m=${nextYm}`}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={nextYm}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-md p-1 text-muted-foreground/30">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
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
