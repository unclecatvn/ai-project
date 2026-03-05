import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getAnalysisItemBySourcePath } from "@/features/reports/lib/analysis";
import { FileViewEditor } from "@/features/reports/components/file-view-editor";
import { AppNavbar } from "@/shared/components/app-navbar";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { getMessages } from "@/shared/i18n/messages";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";

type ReportPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);
  const sourcePath = decodeURIComponent(slug);
  const report = await getAnalysisItemBySourcePath(sourcePath);

  if (!report) {
    notFound();
  }

  return (
    <main className="app-page min-h-screen px-3 py-8 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <AppNavbar lang={lang} initialTheme={initialTheme} />

        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href={`/?lang=${lang}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80" style={{ color: 'var(--ui-link)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {m.reportPage.back}
          </Link>
        </div>

        {/* Report header */}
        <div className="app-card p-5 md:p-6">
          <h1 className="app-text text-2xl font-bold tracking-tight">{report.title}</h1>
          <p className="app-text-soft mt-2 flex items-center gap-2 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {report.sourcePath}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/file-manager/files/download?source_path=${encodeURIComponent(report.sourcePath)}&download=1`}
              download={report.fileName}
              className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {m.reportPage.downloadFile}
            </a>
            <a
              href={`/api/file-manager/files/download?source_path=${encodeURIComponent(report.sourcePath)}&download=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="app-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {m.reportPage.openSourceFile}
            </a>
          </div>
        </div>

        <div className="mt-6">
          <FileViewEditor
            fileId={report.id}
            initialContent={report.content ?? ""}
            lang={lang}
            publicPath={report.publicPath ?? ""}
            fileType={report.type}
          />
        </div>
      </div>
    </main>
  );
}

