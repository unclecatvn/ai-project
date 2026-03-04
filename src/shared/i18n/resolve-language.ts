export type AppLang = "vi" | "en";

export function resolveLanguage(queryLang?: string, acceptLanguage?: string | null, cookieLocale?: string | null): AppLang {
  if (queryLang === "vi" || queryLang === "en") {
    return queryLang;
  }

  if (cookieLocale === "vi" || cookieLocale === "en") {
    return cookieLocale;
  }

  const normalized = (acceptLanguage ?? "").toLowerCase();
  if (normalized.includes("vi")) {
    return "vi";
  }
  return "en";
}
