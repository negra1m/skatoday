import { cookies } from "next/headers";
import { LOCALES, type Locale, t as tFn, type DictKey } from "./dict";

const LOCALE_COOKIE = "skatoday_locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;
  return "pt-BR";
}

export async function setLocale(locale: Locale) {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getT() {
  const locale = await getLocale();
  return (key: DictKey, fallback?: string) => tFn(locale, key, fallback);
}
