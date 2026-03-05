import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getFileById, isSupabaseConfigured } from "@/features/reports/lib/analysis";
import { FileViewEditor } from "@/features/reports/components/file-view-editor";
import { AppNavbar } from "@/shared/components/app-navbar";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { getMessages } from "@/shared/i18n/messages";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";

type FilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function FilePage({ params, searchParams }: FilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);

  if (!isSupabaseConfigured) {
    notFound();
  }

  const file = await getFileById(id);
  if (!file) {
    notFound();
  }

  const categoryLabel = file.folder?.name ?? "File";

  return (
    <main className="app-page min-h-screen px-3 py-8 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <AppNavbar lang={lang} initialTheme={initialTheme} />

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link href={`/?lang=${lang}`} className="inline-flex items-center gap-1.5 font-medium hover:opacity-80" style={{ color: 'var(--ui-link)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {m.reportPage.back}
          </Link>
          <span className="app-text-soft">/</span>
          <span className="app-badge">{categoryLabel}</span>
        </div>

        {/* File header */}
        <div className="app-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="app-text text-2xl font-bold tracking-tight">{file.title}</h1>
              <p className="app-text-soft mt-2 flex items-center gap-2 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {file.source_path}
              </p>
              {Array.isArray(file.tags) && file.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {file.tags.map((tag) => (
                    <span key={tag.id} className="app-badge app-badge-green">{tag.name}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="app-badge">{file.file_type}</span>
              <span className="app-text-soft text-xs font-mono">
                {file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}
              </span>
            </div>
          </div>
        </div>

        {/* Content viewer / editor */}
        <div className="mt-6">
          <FileViewEditor
            fileId={file.id}
            initialContent={file.content ?? ""}
            lang={lang}
            publicPath=""
            fileType={file.file_type}
          />
        </div>
      </div>
    </main>
  );
}

