import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { getSessionByDate, listSessionTricks, listTricks } from "@/db/queries";
import { upsertSession, logSessionTrick } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { LogSwipeRow } from "@/components/ui/log-swipe-row";
import { deleteSessionTrickAction, deleteSkateSessionAction } from "../../actions";
import { todayISO, formatDateInTz } from "@/lib/utils";
import { FlowGauge } from "@/components/hud/FlowGauge";
import { getT, getLocale } from "@/lib/i18n/server";
import { tf, t as tFn } from "@/lib/i18n/dict";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(raw: string | undefined | null, tz: string): string {
  if (raw && ISO_RE.test(raw)) return raw;
  return todayISO(tz);
}

async function saveSession(formData: FormData) {
  "use server";
  const session = (await getCurrentSession())!;
  const date = normalizeDate(formData.get("date") as string | null, session.user.timezone);
  upsertSession({
    profileId: session.profile.id,
    date,
    durationMinutes: Number(formData.get("duration")) || null,
    location: (formData.get("location") as string) || null,
    sessionType: (formData.get("session_type") as "flow") || null,
    feeling: Number(formData.get("feeling")) || null,
    confidence: Number(formData.get("confidence")) || null,
    pain: Number(formData.get("pain")) || null,
    flowState: (formData.get("flow_state") as "ok") || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/skate/sessao");
  redirect(`/skate/sessao?d=${date}`);
}

async function addTrickLog(formData: FormData) {
  "use server";
  const session = (await getCurrentSession())!;
  const date = normalizeDate(formData.get("date") as string | null, session.user.timezone);
  const sessionId = upsertSession({ profileId: session.profile.id, date });
  logSessionTrick({
    profileId: session.profile.id,
    sessionId,
    trickId: String(formData.get("trick_id")),
    attempts: Number(formData.get("attempts")),
    lands: Number(formData.get("lands")),
    bestStreak: Number(formData.get("best_streak")),
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/skate/sessao");
  redirect(`/skate/sessao?d=${date}`);
}

function formatHeaderDate(
  iso: string,
  tz: string,
  locale: "pt-BR" | "en" | "zh-CN",
): { title: string; subtitle: string } {
  const today = todayISO(tz);
  const ystDate = new Date(Date.now() - 86400000);
  const ystISO = formatDateInTz(ystDate, tz);
  if (iso === today) return { title: tFn(locale, "sk.title_today"), subtitle: iso };
  if (iso === ystISO) return { title: tFn(locale, "sk.title_yesterday"), subtitle: iso };
  const [y, m, d] = iso.split("-");
  const pretty = locale === "en" ? `${m}/${d}/${y}` : locale === "zh-CN" ? `${y}-${m}-${d}` : `${d}/${m}/${y}`;
  return { title: tf(tFn(locale, "sk.title_on"), { date: pretty }), subtitle: iso };
}

export default async function SessaoPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const session = (await getCurrentSession())!;
  const t = await getT();
  const locale = await getLocale();
  const tz = session.user.timezone;
  const sp = await searchParams;
  const targetDate = normalizeDate(sp.d ?? null, tz);
  const today = todayISO(tz);
  const existing = getSessionByDate(session.profile.id, targetDate);
  const tricks = listTricks(session.profile.id);
  const logs = existing ? listSessionTricks(existing.id) : [];
  const header = formatHeaderDate(targetDate, tz, locale);

  // Atalhos rápidos: hoje, ontem (no fuso do user)
  const yesterdayISO = formatDateInTz(new Date(Date.now() - 86400000), tz);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-hud text-2xl font-semibold">{header.title}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{header.subtitle}</p>
        </div>
        {existing && (
          <DeleteButton
            action={deleteSkateSessionAction}
            id={existing.id}
            message={t("sk.confirm_delete_session")}
            size="md"
          />
        )}
      </div>

      <Card>
        <CardContent className="flex items-center gap-2 py-3">
          <a
            href={`/skate/sessao?d=${today}`}
            className={
              "rounded-md px-3 py-1.5 text-xs uppercase tracking-widest transition-colors " +
              (targetDate === today
                ? "bg-foreground text-background"
                : "border border-input bg-secondary text-muted-foreground hover:text-foreground")
            }
          >
            {t("common.today")}
          </a>
          <a
            href={`/skate/sessao?d=${yesterdayISO}`}
            className={
              "rounded-md px-3 py-1.5 text-xs uppercase tracking-widest transition-colors " +
              (targetDate === yesterdayISO
                ? "bg-foreground text-background"
                : "border border-input bg-secondary text-muted-foreground hover:text-foreground")
            }
          >
            {t("common.yesterday")}
          </a>
          <form action="/skate/sessao" method="get" className="flex flex-1 items-center gap-2">
            <Input type="date" name="d" defaultValue={targetDate} max={today} className="flex-1" />
            <Button type="submit" variant="outline" size="sm">
              {t("common.ok")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sk.how_was")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSession} className="space-y-3">
            <input type="hidden" name="date" value={targetDate} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="duration">{t("sk.duration")}</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={0}
                  defaultValue={existing?.durationMinutes ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">{t("sk.location")}</Label>
                <Input id="location" name="location" defaultValue={existing?.location ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="session_type">{t("sk.type")}</Label>
                <Select id="session_type" name="session_type" defaultValue={existing?.sessionType ?? "livre"}>
                  <option value="">—</option>
                  <option value="flow">flow</option>
                  <option value="tech">tech</option>
                  <option value="livre">livre</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="flow_state">{t("sk.flow")}</Label>
                <Select id="flow_state" name="flow_state" defaultValue={existing?.flowState ?? ""}>
                  <option value="">—</option>
                  <option value="travado">travado</option>
                  <option value="ok">ok</option>
                  <option value="fluido">fluido</option>
                  <option value="absurdo">absurdo</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="feeling">{t("sk.feeling")}</Label>
                <Input
                  id="feeling"
                  name="feeling"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={existing?.feeling ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confidence">{t("sk.confidence")}</Label>
                <Input
                  id="confidence"
                  name="confidence"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={existing?.confidence ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pain">{t("sk.pain")}</Label>
                <Input
                  id="pain"
                  name="pain"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={existing?.pain ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea id="notes" name="notes" defaultValue={existing?.notes ?? ""} rows={3} />
            </div>
            <FlowGauge state={existing?.flowState ?? null} />
            <Button type="submit" className="w-full">
              {t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sk.add_trick_logged")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addTrickLog} className="space-y-3">
            <input type="hidden" name="date" value={targetDate} />
            <div className="space-y-1">
              <Label htmlFor="trick_id">{t("sk.trick")}</Label>
              <Select id="trick_id" name="trick_id" required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                {tricks.map((tk) => (
                  <option key={tk.id} value={tk.id}>
                    {tk.name} · {tk.status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="attempts">{t("sk.attempts")}</Label>
                <Input id="attempts" name="attempts" type="number" min={0} defaultValue={0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lands">{t("sk.lands")}</Label>
                <Input id="lands" name="lands" type="number" min={0} defaultValue={0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="best_streak">{t("sk.best_streak")}</Label>
                <Input id="best_streak" name="best_streak" type="number" min={0} defaultValue={0} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="trick_notes">{t("common.notes")}</Label>
              <Textarea id="trick_notes" name="notes" rows={2} placeholder={t("sk.trick_notes_placeholder")} />
            </div>
            <Button type="submit" className="w-full">
              {t("sk.btn_register_trick")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("sk.trained_today")} ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map((l) => (
              <LogSwipeRow
                key={l.st.id}
                id={l.st.id}
                deleteAction={deleteSessionTrickAction}
                confirmMessage={t("sk.confirm_delete_trick_log")}
              >
                <div className="flex items-center justify-between gap-2 border border-border bg-card px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{l.trick.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {l.st.lands}/{l.st.attempts} · streak {l.st.bestStreak}
                      {l.st.isBaseRun && ` · ${t("sk.in_base")}`}
                    </div>
                    {l.st.notes && <div className="mt-0.5 text-xs text-muted-foreground">{l.st.notes}</div>}
                  </div>
                  <span className="text-hud text-xs tabular-nums text-muted-foreground">
                    {l.st.attempts > 0 ? Math.round((l.st.lands / l.st.attempts) * 100) : 0}%
                  </span>
                </div>
              </LogSwipeRow>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
