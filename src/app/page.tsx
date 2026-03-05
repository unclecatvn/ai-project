import { getAllAnalysisItems, isSupabaseConfigured } from "@/features/reports/lib/analysis";
import { ReportExplorer } from "@/features/reports/components/report-explorer";
import { cookies, headers } from "next/headers";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { AppNavbar } from "@/shared/components/app-navbar";
import { getMessages } from "@/shared/i18n/messages";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";

type HomePageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);
  const reports = await getAllAnalysisItems();

  return (
    <main className="vscode-page">
      <AppNavbar lang={lang} initialTheme={initialTheme} />
      <ReportExplorer items={reports} lang={lang} />
      {reports.length === 0 ? (
        <p className="app-warning mt-4 mx-4 rounded-lg p-4 text-sm">{m.home.emptySync}</p>
      ) : null}
    </main>
  );
}
