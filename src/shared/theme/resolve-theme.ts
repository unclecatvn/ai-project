export type AppTheme = "light" | "dark";

export const THEME_COOKIE_KEY = "REPORT_THEME";

export function resolveTheme(cookieTheme?: string | null): AppTheme {
  if (cookieTheme === "dark" || cookieTheme === "light") {
    return cookieTheme;
  }
  return "light";
}
