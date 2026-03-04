import { getAllAnalysisItems } from "@/features/reports/lib/analysis";
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
  const reports = getAllAnalysisItems();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);

  return (
    <main className="app-page min-h-screen px-3 py-8 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <AppNavbar lang={lang} initialTheme={initialTheme} />
        <div className="mb-1">
          <h1 className="app-text text-3xl font-bold tracking-tight">{m.home.title}</h1>
          <p className="app-text-soft mt-2 text-sm leading-relaxed">{m.home.description}</p>
        </div>
        <ReportExplorer items={reports} lang={lang} />

        {reports.length === 0 ? (
          <p className="app-warning mt-8 rounded-lg p-4 text-sm">{m.home.emptySync}</p>
        ) : null}
      </div>
    </main>
  );
}
