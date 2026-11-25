import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en","hi","zh","es","ar","fr","bn","pt","id","ur","tr","ru","ja"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: readonly Locale[] = ["ar", "ur"];

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const requested = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const locale: Locale = requested && (locales as readonly string[]).includes(requested)
    ? (requested as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
