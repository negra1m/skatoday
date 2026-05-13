import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { upsertSubscription } from "@/db/push";
import { getPublicKey } from "@/lib/push";

export async function GET() {
  // Cliente busca a public key
  return NextResponse.json({ publicKey: getPublicKey() });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      }
    | null;

  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return NextResponse.json({ error: "subscription-invalid" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent");
  const id = upsertSubscription({
    userId: user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    userAgent,
  });
  return NextResponse.json({ ok: true, id });
}
