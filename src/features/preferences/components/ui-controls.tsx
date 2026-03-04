"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMessages } from "@/shared/i18n/messages";
import { THEME_COOKIE_KEY, type AppTheme } from "@/shared/theme/resolve-theme";

type UiControlsProps = {
  lang: "vi" | "en";
  initialTheme: AppTheme;
};

type LanguageMode = "vi" | "en";

const THEME_STORAGE_KEY = "report-viewer-theme";
const LANGUAGE_STORAGE_KEY = "report-viewer-language";
const LOCALE_COOKIE_KEY = "NEXT_LOCALE";

function readPreferredLanguage(): LanguageMode {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "vi" || stored === "en") {
    return stored;
  }
  return window.navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function UiControls({ lang, initialTheme }: UiControlsProps) {
  const [theme, setTheme] = useState<AppTheme>(initialTheme);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  useEffect(() => {
    const queryLang = searchParams.get("lang");
    if (queryLang === "vi" || queryLang === "en") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, queryLang);
      document.cookie = `${LOCALE_COOKIE_KEY}=${queryLang}; path=/; max-age=31536000; samesite=lax`;
      return;
    }
    const preferred = readPreferredLanguage();
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", preferred);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const labels = getMessages(lang).controls;

  function switchLang(nextLang: "vi" | "en") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLang);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLang}; path=/; max-age=31536000; samesite=lax`;
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="app-segmented text-xs">
        <button type="button" onClick={() => setTheme("light")} className={`app-segmented-btn ${theme === "light" ? "app-segmented-btn-active" : ""}`}>
          {labels.light}
        </button>
        <button type="button" onClick={() => setTheme("dark")} className={`app-segmented-btn ${theme === "dark" ? "app-segmented-btn-active" : ""}`}>
          {labels.dark}
        </button>
      </div>

      <div className="app-segmented text-xs">
        <span className="app-text-soft self-center px-2">{labels.language}</span>
        <button type="button" onClick={() => switchLang("vi")} className={`app-segmented-btn ${lang === "vi" ? "app-segmented-btn-active" : ""}`}>
          {labels.vietnamese}
        </button>
        <button type="button" onClick={() => switchLang("en")} className={`app-segmented-btn ${lang === "en" ? "app-segmented-btn-active" : ""}`}>
          {labels.english}
        </button>
      </div>
    </div>
  );
}
