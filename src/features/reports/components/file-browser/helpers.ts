import type { AnalysisItem } from "@/features/reports/lib/analysis";
import type { ExplorerNode, ExplorerFolderNode, FolderNode } from "@/features/reports/components/file-browser/types";

export function getFolderPath(sourcePath: string) {
  const index = sourcePath.lastIndexOf("/");
  return index === -1 ? "(root)" : sourcePath.slice(0, index);
}

export function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildFolderTree(items: AnalysisItem[], lang: "vi" | "en"): FolderNode[] {
  const roots: FolderNode[] = [];
  const folderCounts = new Map<string, number>();
  for (const item of items) {
    const folder = getFolderPath(item.sourcePath);
    folderCounts.set(folder, (folderCounts.get(folder) ?? 0) + 1);
  }

  for (const [folderPath, count] of folderCounts.entries()) {
    if (folderPath === "(root)") continue;
    const segments = folderPath.split("/");
    let currentPath = "";
    let currentLevel = roots;

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let node = currentLevel.find((entry) => entry.path === currentPath);
      if (!node) {
        node = { name: segment, path: currentPath, totalCount: 0, children: [] };
        currentLevel.push(node);
      }
      node.totalCount += count;
      currentLevel = node.children;
    }
  }

  const sortTree = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, lang));
    for (const node of nodes) {
      sortTree(node.children);
    }
  };
  sortTree(roots);
  return roots;
}

/**
 * Build a unified file tree (folders + files) for VS Code Explorer style.
 * Folders come first (sorted), then files (sorted).
 */
export function buildExplorerTree(items: AnalysisItem[], lang: "vi" | "en"): ExplorerNode[] {
  const roots: ExplorerNode[] = [];

  // Group items by their folder path
  for (const item of items) {
    const folderPath = getFolderPath(item.sourcePath);
    const fileNode: ExplorerNode = {
      kind: "file",
      name: item.fileName,
      path: item.sourcePath,
      fileType: item.type,
      size: item.size,
    };

    if (folderPath === "(root)") {
      roots.push(fileNode);
      continue;
    }

    // Ensure all ancestor folders exist
    const segments = folderPath.split("/");
    let currentPath = "";
    let currentLevel = roots;

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let existing = currentLevel.find(
        (n): n is ExplorerFolderNode => n.kind === "folder" && n.path === currentPath
      );
      if (!existing) {
        existing = { kind: "folder", name: segment, path: currentPath, children: [], fileCount: 0 };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    }

    // Add file to the deepest folder
    currentLevel.push(fileNode);
  }

  // Sort recursively: folders first (sorted by name), then files (sorted by name)
  const sortNodes = (nodes: ExplorerNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, lang);
    });
    for (const node of nodes) {
      if (node.kind === "folder") {
        // Count direct files
        node.fileCount = countFiles(node);
        sortNodes(node.children);
      }
    }
  };
  sortNodes(roots);
  return roots;
}

/** Count all files (recursively) under a folder node */
function countFiles(node: ExplorerFolderNode): number {
  let count = 0;
  for (const child of node.children) {
    if (child.kind === "file") count += 1;
    else count += countFiles(child);
  }
  return count;
}

/** Get the file type icon character */
export function getFileIcon(fileType: string): string {
  switch (fileType) {
    case "markdown": return "M";
    case "html": return "H";
    case "json": return "J";
    case "yaml": return "Y";
    default: return "T";
  }
}

/** Get breadcrumb segments from a source path */
export function getBreadcrumbs(sourcePath: string): string[] {
  return sourcePath.split("/");
}
