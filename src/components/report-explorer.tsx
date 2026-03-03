"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnalysisItem } from "@/lib/analysis";

type ReportExplorerProps = {
  items: AnalysisItem[];
};

type FolderInfo = {
  folder: string;
  count: number;
};

type FolderNode = {
  name: string;
  path: string;
  directCount: number;
  totalCount: number;
  children: FolderNode[];
};

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getFolderPath(sourcePath: string) {
  const index = sourcePath.lastIndexOf("/");
  return index === -1 ? "(gốc)" : sourcePath.slice(0, index);
}

export function ReportExplorer({ items }: ReportExplorerProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>("Tất cả");
  const [query, setQuery] = useState<string>("");
  const [folderQuery, setFolderQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "markdown" | "html">("all");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const folders: FolderInfo[] = useMemo(() => {
    const counter = new Map<string, number>();
    for (const item of items) {
      const folder = getFolderPath(item.sourcePath);
      counter.set(folder, (counter.get(folder) ?? 0) + 1);
    }
    return Array.from(counter.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "vi"))
      .map(([folder, count]) => ({ folder, count }));
  }, [items]);

  const folderTree = useMemo(() => {
    const roots: FolderNode[] = [];

    for (const folderEntry of folders) {
      if (folderEntry.folder === "(gốc)") {
        continue;
      }
      const segments = folderEntry.folder.split("/");
      let currentPath = "";
      let currentLevel = roots;
      let currentNode: FolderNode | undefined;

      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        currentNode = currentLevel.find((node) => node.path === currentPath);
        if (!currentNode) {
          currentNode = {
            name: segment,
            path: currentPath,
            directCount: 0,
            totalCount: 0,
            children: [],
          };
          currentLevel.push(currentNode);
        }
        currentLevel = currentNode.children;
      }

      if (currentNode) {
        currentNode.directCount = folderEntry.count;
      }
    }

    for (const node of roots) {
      computeTotalCount(node);
      sortTree(node);
    }
    roots.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    return roots;
  }, [folders]);

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    for (const node of folderTree) {
      initialExpanded[node.path] = true;
    }
    setExpandedFolders(initialExpanded);
  }, [folderTree]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const folder = getFolderPath(item.sourcePath);
      const matchFolder =
        selectedFolder === "Tất cả" ||
        (selectedFolder === "(gốc)" ? folder === "(gốc)" : folder === selectedFolder || folder.startsWith(`${selectedFolder}/`));
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        q.length === 0 ||
        item.sourcePath.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q);
      return matchFolder && matchType && matchQuery;
    });
  }, [items, query, selectedFolder, typeFilter]);

  const markdownCount = items.filter((item) => item.type === "markdown").length;
  const htmlCount = items.length - markdownCount;
  const hasActiveFilter = selectedFolder !== "Tất cả" || typeFilter !== "all" || query.trim().length > 0;
  const rootFilesCount = folders.find((entry) => entry.folder === "(gốc)")?.count ?? 0;

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  function setExpandAll(expanded: boolean) {
    const nextState: Record<string, boolean> = {};
    const stack = [...folderTree];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      nextState[current.path] = expanded;
      stack.push(...current.children);
    }
    setExpandedFolders(nextState);
  }

  function matchesFolderSearch(node: FolderNode, q: string): boolean {
    if (!q) {
      return true;
    }
    if (node.path.toLowerCase().includes(q) || node.name.toLowerCase().includes(q)) {
      return true;
    }
    return node.children.some((child) => matchesFolderSearch(child, q));
  }

  function renderTreeNode(node: FolderNode, depth = 0) {
    const q = folderQuery.trim().toLowerCase();
    if (!matchesFolderSearch(node, q)) {
      return null;
    }

    const isExpanded = expandedFolders[node.path] ?? depth === 0;
    const isActive = selectedFolder === node.path;
    const hasChildren = node.children.length > 0;

    return (
      <li key={node.path} className="space-y-1">
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${
            isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleFolder(node.path)}
            className={`h-5 w-5 rounded text-xs ${hasChildren ? "opacity-90" : "opacity-30"}`}
            aria-label={hasChildren ? "Mở/đóng thư mục con" : "Thư mục không có nhánh con"}
          >
            {hasChildren ? (isExpanded ? "▾" : "▸") : "•"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedFolder(node.path)}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
          >
            <span className="truncate text-sm">📁 {node.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? "bg-slate-700" : "bg-slate-200 text-slate-700"}`}>
              {node.totalCount}
            </span>
          </button>
        </div>
        {hasChildren && isExpanded ? (
          <ul className="space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tổng số file</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Markdown</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{markdownCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">HTML</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{htmlCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Thư mục nguồn</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{folders.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Thư mục</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpandAll(true)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                Mở hết
              </button>
              <button
                type="button"
                onClick={() => setExpandAll(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                Thu gọn
              </button>
            </div>
          </div>

          <input
            type="text"
            value={folderQuery}
            onChange={(event) => setFolderQuery(event.target.value)}
            placeholder="Tìm thư mục..."
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />

          <button
            type="button"
            onClick={() => setSelectedFolder("Tất cả")}
            className={`mb-2 w-full rounded-md px-3 py-2 text-left text-sm ${
              selectedFolder === "Tất cả" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tất cả ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFolder("(gốc)")}
            className={`mb-2 w-full rounded-md px-3 py-2 text-left text-sm ${
              selectedFolder === "(gốc)" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            File ở gốc ({rootFilesCount})
          </button>

          <div className="max-h-[calc(100%-165px)] overflow-auto pr-1">
            <ul className="space-y-1">{folderTree.map((node) => renderTreeNode(node))}</ul>
            {folderTree.length > 0 && folderTree.every((node) => !matchesFolderSearch(node, folderQuery.trim().toLowerCase())) ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Không có thư mục phù hợp.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên file, tiêu đề, đường dẫn..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | "markdown" | "html")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="all">Tất cả loại file</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </div>

          {hasActiveFilter ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                Thư mục: {selectedFolder === "Tất cả" ? "Tất cả" : selectedFolder}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                Loại: {typeFilter === "all" ? "Tất cả" : typeFilter}
              </span>
              {query.trim() ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Từ khóa: {query.trim()}</span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSelectedFolder("Tất cả");
                  setTypeFilter("all");
                  setQuery("");
                }}
                className="rounded-full border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : null}

          <p className="mb-3 text-sm text-slate-600">
            Hiển thị <strong>{filteredItems.length}</strong> file
            {selectedFolder !== "Tất cả" ? ` trong thư mục "${selectedFolder}"` : ""}.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">Tên file</th>
                  <th className="px-2 py-2 font-medium">Loại</th>
                  <th className="px-2 py-2 font-medium">Dung lượng</th>
                  <th className="px-2 py-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-2 py-3">
                      <p className="font-medium text-slate-900">{item.fileName}</p>
                      <p className="text-xs text-slate-500">{item.sourcePath}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{item.type}</span>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatSize(item.size)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/reports/${encodeURIComponent(item.id)}`}
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Xem
                        </Link>
                        <a
                          href={item.publicPath}
                          download={item.fileName}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Tải
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Không tìm thấy file phù hợp với bộ lọc hiện tại.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function computeTotalCount(node: FolderNode): number {
  const childrenTotal = node.children.reduce((sum, child) => sum + computeTotalCount(child), 0);
  node.totalCount = node.directCount + childrenTotal;
  return node.totalCount;
}

function sortTree(node: FolderNode) {
  node.children.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  for (const child of node.children) {
    sortTree(child);
  }
}
