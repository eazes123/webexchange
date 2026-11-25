export const locales = ["en","hi","zh","es","ar","fr","bn","pt","id","ur","tr","ru","ja"] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: readonly Locale[] = ["ar", "ur"];
