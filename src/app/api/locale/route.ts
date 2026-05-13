import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n/dict";
import { setLocale } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { locale?: string };
  const locale = body.locale as Locale | undefined;
  if (!locale || !LOCALES.includes(locale)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await setLocale(locale);
  return NextResponse.json({ ok: true });
}
