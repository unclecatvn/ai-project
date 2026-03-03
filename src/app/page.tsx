import { getAllAnalysisItems } from "@/lib/analysis";
import { ReportExplorer } from "@/components/report-explorer";

export default function Home() {
  const reports = getAllAnalysisItems();

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-900 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <h1 className="text-3xl font-bold tracking-tight">Trình xem báo cáo phân tích</h1>
        <p className="mt-3 text-sm text-slate-600">
          Danh sách file Markdown/HTML được tự động quét từ project gốc để xem nhanh trên local và Vercel.
        </p>
        <p className="mt-1 text-sm text-slate-500">Tổng cộng: {reports.length} file</p>
        <ReportExplorer items={reports} />

        {reports.length === 0 ? (
          <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Chưa có file nào được đồng bộ. Hãy chạy lại `npm run predev` để cập nhật danh sách file.
          </p>
        ) : null}
      </div>
    </main>
  );
}
