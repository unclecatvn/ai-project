import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportMarkdown } from "@/components/report-markdown";
import { getAllAnalysisItems, getAnalysisItemById } from "@/lib/analysis";

type ReportPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllAnalysisItems().map((item) => ({ slug: item.id }));
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug } = await params;
  const report = getAnalysisItemById(decodeURIComponent(slug));

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-900 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <Link href="/" className="text-sm text-blue-700 hover:text-blue-900">
          ← Quay lại danh sách
        </Link>

        <h1 className="mt-4 text-2xl font-bold">{report.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Nguồn: {report.sourcePath}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={report.publicPath}
            download={report.fileName}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Tải file
          </a>
          <a
            href={report.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Mở file gốc
          </a>
        </div>

        <div className="mt-8">
          {report.type === "html" ? (
            <iframe
              src={report.publicPath}
              title={report.title}
              className="h-[80vh] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
            />
          ) : (
            <ReportMarkdown publicPath={report.publicPath} />
          )}
        </div>
      </div>
    </main>
  );
}
