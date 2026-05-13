import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteSubscriptionByEndpoint } from "@/db/push";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "endpoint-missing" }, { status: 400 });
  deleteSubscriptionByEndpoint(body.endpoint);
  return NextResponse.json({ ok: true });
}
