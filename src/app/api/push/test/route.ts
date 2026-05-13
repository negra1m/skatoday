import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionsForUser, deleteSubscriptionById } from "@/db/push";
import { sendPush } from "@/lib/push";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const subs = getSubscriptionsForUser(user.id);
  if (subs.length === 0) {
    return NextResponse.json({ error: "no-subscriptions", count: 0 });
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const s of subs) {
    const res = await sendPush(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      {
        title: "💧 skatoday — teste",
        body: "Notificação de teste — se chegou, tá funcionando!",
        url: "/agua",
        tag: "skatoday-test",
      },
    );
    if (res.gone) deleteSubscriptionById(s.id);
    results.push({ id: s.id, ok: res.ok, error: res.error });
  }
  return NextResponse.json({ ok: true, results });
}
