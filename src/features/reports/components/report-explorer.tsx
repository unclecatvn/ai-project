import type { AnalysisItem } from "@/features/reports/lib/analysis";
import { FileBrowserLayout } from "@/features/reports/components/file-browser/file-browser-layout";
import type { AppLang } from "@/shared/i18n/resolve-language";

type ReportExplorerProps = {
  items: AnalysisItem[];
  lang: AppLang;
};

export function ReportExplorer({ items, lang }: ReportExplorerProps) {
  return <FileBrowserLayout items={items} lang={lang} />;
}
