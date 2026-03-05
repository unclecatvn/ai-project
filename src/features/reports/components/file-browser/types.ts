import type { AnalysisItem } from "@/features/reports/lib/analysis";

export type FileTypeFilter = "all" | AnalysisItem["type"];
export type SensitivityFilter = "all" | AnalysisItem["sensitivity"];

export type BrowserPreviewFile = AnalysisItem;

export type FolderNode = {
  name: string;
  path: string;
  totalCount: number;
  children: FolderNode[];
};

/* ─── VS Code Explorer types ─── */

export type ExplorerFileNode = {
  kind: "file";
  name: string;
  path: string; // source_path
  fileType: AnalysisItem["type"];
  size: number;
};

export type ExplorerFolderNode = {
  kind: "folder";
  name: string;
  path: string;
  children: ExplorerNode[];
  fileCount: number;
};

export type ExplorerNode = ExplorerFileNode | ExplorerFolderNode;

export type EditorTab = {
  sourcePath: string;
  fileName: string;
  fileType: AnalysisItem["type"];
};
