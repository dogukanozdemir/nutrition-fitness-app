"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale } from "@/lib/i18n";

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current && typeof current === "object" && p in current) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "tr" || stored === "en") setLocaleState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("locale", locale);
  }, [locale, mounted]);

  function setLocale(l: Locale) {
    setLocaleState(l);
  }

  function t(key: string): string {
    const val = getNested(translations[locale] as Record<string, unknown>, key);
    return val ?? key;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => key,
    };
  }
  return ctx;
}
