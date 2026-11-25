"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n-config";

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  zh: "中文",
  es: "Español",
  ar: "العربية",
  fr: "Français",
  bn: "বাংলা",
  pt: "Português",
  id: "Bahasa Indonesia",
  ur: "اردو",
  tr: "Türkçe",
  ru: "Русский",
  ja: "日本語",
};

const FLAG_EMOJIS: Record<Locale, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  zh: "🇨🇳",
  es: "🇪🇸",
  ar: "🇸🇦",
  fr: "🇫🇷",
  bn: "🇧🇩",
  pt: "🇧🇷",
  id: "🇮🇩",
  ur: "🇵🇰",
  tr: "🇹🇷",
  ru: "🇷🇺",
  ja: "🇯🇵",
};

function getCurrentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const val = match?.[1] as Locale | undefined;
  return val && (locales as readonly string[]).includes(val) ? val : "en";
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLocale());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(locale: Locale) {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    setCurrent(locale);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/80 hover:text-white"
        aria-label="Switch language"
      >
        <span className="text-base leading-none">{FLAG_EMOJIS[current]}</span>
        <span className="hidden sm:inline font-medium">{LANGUAGE_NAMES[current]}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-white/10 bg-[#0d0d0d] shadow-2xl py-1 max-h-80 overflow-y-auto">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                current === locale ? "text-[#f0a500] font-medium" : "text-white/70 hover:text-white"
              }`}
            >
              <span className="text-base">{FLAG_EMOJIS[locale]}</span>
              <span>{LANGUAGE_NAMES[locale]}</span>
              {current === locale && (
                <svg className="w-3.5 h-3.5 ml-auto text-[#f0a500]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
