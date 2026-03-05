"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnalysisItem } from "@/features/reports/lib/analysis";
import { buildExplorerTree } from "@/features/reports/components/file-browser/helpers";
import { ExplorerSidebar } from "@/features/reports/components/file-browser/folder-tree-panel";
import { EditorPane } from "@/features/reports/components/file-browser/file-preview-pane";
import type { AppLang } from "@/shared/i18n/resolve-language";
import type { EditorTab } from "@/features/reports/components/file-browser/types";

type FileBrowserLayoutProps = {
  items: AnalysisItem[];
  lang: AppLang;
};

export function FileBrowserLayout({ items: initialItems, lang }: FileBrowserLayoutProps) {
  /* ─── State ─── */
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<AnalysisItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  /* ─── Derived ─── */
  const explorerTree = useMemo(() => buildExplorerTree(items, lang), [items, lang]);

  // Build a lookup map: source_path → AnalysisItem (for direct ID access, avoid n+1)
  const itemsByPath = useMemo(() => {
    const map = new Map<string, AnalysisItem>();
    for (const item of items) {
      map.set(item.sourcePath, item);
    }
    return map;
  }, [items]);

  /* ─── Data refresh (no full page reload) ─── */
  const refreshItems = useCallback(async () => {
    try {
      const res = await fetch("/api/file-manager/files?include_content=false", { cache: "no-store" });
      if (!res.ok) return;
      const payload = await res.json();
      if (Array.isArray(payload.files)) {
        const refreshed: AnalysisItem[] = payload.files.map((f: Record<string, unknown>) => ({
          id: f.id as string,
          title: f.title as string,
          sourcePath: f.source_path as string,
          fileName: f.file_name as string,
          type: f.file_type as string,
          publicPath: (f.public_path as string) ?? "",
          size: (f.size as number) ?? 0,
          content: (f.content as string) ?? "",
          sensitivity: (f.sensitivity_level as string) ?? "internal",
          tags: Array.isArray((f.metadata as Record<string, unknown>)?.tags) ? (f.metadata as Record<string, unknown>).tags as string[] : [],
          updatedAt: f.updated_at as string,
        }));
        setItems(refreshed);
      }
    } catch {
      // fallback: full reload
      window.location.reload();
    }
  }, []);

  /* ─── Load preview when active tab changes ─── */
  useEffect(() => {
    if (!activeTab) {
      setPreviewItem(null);
      return;
    }

    let ignore = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/file-manager/files/by-source?source_path=${encodeURIComponent(activeTab)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`Preview request failed: ${res.status}`);
        const payload = await res.json();
        if (!ignore && payload?.file) {
          setPreviewItem({
            id: payload.file.id,
            title: payload.file.title,
            sourcePath: payload.file.source_path,
            fileName: payload.file.file_name,
            type: payload.file.file_type,
            publicPath: payload.file.public_path,
            size: payload.file.size,
            content: payload.file.content,
            sensitivity: payload.file.sensitivity_level ?? "internal",
            tags: Array.isArray(payload.file.metadata?.tags) ? payload.file.metadata.tags : [],
            updatedAt: payload.file.updated_at,
          });
        }
      } catch {
        if (!ignore) setPreviewItem(null);
      } finally {
        if (!ignore) setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => { ignore = true; };
  }, [activeTab]);

  /* ─── Handlers ─── */

  function handleFileSelect(sourcePath: string) {
    // Add tab if not already open
    if (!tabs.find((t) => t.sourcePath === sourcePath)) {
      const item = items.find((i) => i.sourcePath === sourcePath);
      if (item) {
        setTabs((prev) => [...prev, {
          sourcePath: item.sourcePath,
          fileName: item.fileName,
          fileType: item.type,
        }]);
      }
    }
    setActiveTab(sourcePath);
  }

  function handleCloseTab(sourcePath: string) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.sourcePath !== sourcePath);
      // If closing the active tab, switch to the last remaining tab
      if (activeTab === sourcePath) {
        setActiveTab(next.length > 0 ? next[next.length - 1].sourcePath : null);
      }
      return next;
    });
  }

  function handleSelectTab(sourcePath: string) {
    setActiveTab(sourcePath);
  }

  /** Delete a file by its ID (called from sidebar) */
  const handleDeleteFile = useCallback(async (fileId: string, sourcePath: string) => {
    try {
      const res = await fetch(`/api/file-manager/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      // Close tab if open
      setTabs((prev) => prev.filter((t) => t.sourcePath !== sourcePath));
      if (activeTab === sourcePath) {
        setActiveTab(null);
      }

      // Refresh item list
      await refreshItems();
    } catch {
      // Ignore
    }
  }, [activeTab, refreshItems]);

  /** Delete all files under a folder path prefix */
  const handleDeleteFolder = useCallback(async (folderPath: string) => {
    // Find all files with source_path starting with folderPath/
    const filesToDelete = items.filter((item) =>
      item.sourcePath.startsWith(`${folderPath}/`)
    );

    if (filesToDelete.length === 0) return;

    // Batch delete (sequential to avoid server overload)
    for (const item of filesToDelete) {
      try {
        await fetch(`/api/file-manager/files/${item.id}`, { method: "DELETE" });
      } catch {
        // Skip failed ones
      }
    }

    // Close affected tabs
    setTabs((prev) => prev.filter((t) => !t.sourcePath.startsWith(`${folderPath}/`)));
    if (activeTab?.startsWith(`${folderPath}/`)) {
      setActiveTab(null);
    }

    await refreshItems();
  }, [items, activeTab, refreshItems]);

  /** Rename a file by its ID */
  const handleRenameFile = useCallback(async (
    fileId: string,
    oldPath: string,
    newName: string,
  ) => {
    const parts = oldPath.split("/");
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");

    try {
      const res = await fetch(`/api/file-manager/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newName.replace(/\.[^.]+$/, ""),
          file_name: newName,
          source_path: newPath,
        }),
      });
      if (!res.ok) throw new Error("Rename failed");

      // Update tab if open
      setTabs((prev) =>
        prev.map((t) =>
          t.sourcePath === oldPath
            ? { ...t, sourcePath: newPath, fileName: newName }
            : t,
        ),
      );
      if (activeTab === oldPath) {
        setActiveTab(newPath);
      }

      await refreshItems();
    } catch {
      // Ignore
    }
  }, [activeTab, refreshItems]);

  return (
    <div className="vscode-layout">
      <ExplorerSidebar
        lang={lang}
        tree={explorerTree}
        activeFilePath={activeTab}
        onFileSelect={handleFileSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refreshItems}
        onDeleteFile={handleDeleteFile}
        onDeleteFolder={handleDeleteFolder}
        onRenameFile={handleRenameFile}
        itemsByPath={itemsByPath}
      />
      <EditorPane
        lang={lang}
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        item={previewItem}
        loading={previewLoading}
      />
    </div>
  );
}
