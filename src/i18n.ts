import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "./i18n-config";

export { locales, defaultLocale, rtlLocales } from "./i18n-config";
export type { Locale } from "./i18n-config";

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
