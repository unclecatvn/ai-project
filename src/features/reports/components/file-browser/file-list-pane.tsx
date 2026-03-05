"use client";

import Link from "next/link";
import type { AnalysisItem } from "@/features/reports/lib/analysis";
import { formatSize } from "@/features/reports/components/file-browser/helpers";
import { getMessages } from "@/shared/i18n/messages";
import type { AppLang } from "@/shared/i18n/resolve-language";

type FileListPaneProps = {
  lang: AppLang;
  items: AnalysisItem[];
  selectedSourcePath: string | null;
  onSelectItem: (item: AnalysisItem) => void;
  onCopyPath: (path: string) => void;
};

export function FileListPane({
  lang,
  items,
  selectedSourcePath,
  onSelectItem,
  onCopyPath,
}: FileListPaneProps) {
  const m = getMessages(lang).explorer;

  return (
    <div className="app-card p-4">
      <p className="app-text-muted mb-3 text-sm">
        {m.showing} <strong>{items.length}</strong> {m.files}.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="app-table-row-border app-text-soft border-b">
              <th className="px-3 py-2.5 font-medium">{m.fileName}</th>
              <th className="px-3 py-2.5 font-medium">{m.type}</th>
              <th className="px-3 py-2.5 font-medium">{m.size}</th>
              <th className="px-3 py-2.5 font-medium">{m.sensitivity}</th>
              <th className="px-3 py-2.5 font-medium">{m.actions}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const active = selectedSourcePath === item.sourcePath;
              return (
                <tr
                  key={item.sourcePath}
                  className={`app-table-row-border border-b align-top ${active ? "app-accent-bg" : "app-hover-muted"}`}
                >
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => onSelectItem(item)} className="text-left">
                      <p className="app-text font-medium">{item.fileName}</p>
                      <p className="app-text-soft mt-0.5 truncate text-xs">{item.sourcePath}</p>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`app-badge ${item.type === "markdown" ? "app-badge-green" : ""}`}>{item.type}</span>
                  </td>
                  <td className="app-text-muted px-3 py-3 font-mono text-xs">{formatSize(item.size)}</td>
                  <td className="px-3 py-3">
                    <span className="app-badge">{item.sensitivity}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/reports/${encodeURIComponent(item.sourcePath)}?lang=${lang}`} className="app-button-primary inline-flex items-center px-3 py-1.5 text-xs font-medium">
                        {m.view}
                      </Link>
                      <a
                        href={`/api/file-manager/files/download?source_path=${encodeURIComponent(item.sourcePath)}&download=1`}
                        download={item.fileName}
                        className="app-button-secondary inline-flex items-center px-3 py-1.5 text-xs font-medium"
                      >
                        {m.download}
                      </a>
                      <a
                        href={`/api/file-manager/files/download?source_path=${encodeURIComponent(item.sourcePath)}&download=0`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-button-secondary inline-flex items-center px-3 py-1.5 text-xs font-medium"
                      >
                        {m.openRaw}
                      </a>
                      <button
                        type="button"
                        onClick={() => onCopyPath(item.sourcePath)}
                        className="app-button-ghost inline-flex items-center px-3 py-1.5 text-xs font-medium"
                      >
                        {m.copyPath}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? (
        <p className="app-warning mt-4 rounded-md px-3 py-2 text-sm">{m.noFilesMatched}</p>
      ) : null}
    </div>
  );
}
