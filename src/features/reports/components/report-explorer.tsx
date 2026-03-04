"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AnalysisItem } from "@/features/reports/lib/analysis";
import { getMessages } from "@/shared/i18n/messages";

type ReportExplorerProps = {
  items: AnalysisItem[];
  lang: "vi" | "en";
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

/* ─── SVG Icons ─── */

function IconFiles() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconMarkdown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFolderSmall({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ─── Helpers ─── */

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
  return index === -1 ? "(root)" : sourcePath.slice(0, index);
}

/* ─── Component ─── */

export function ReportExplorer({ items, lang }: ReportExplorerProps) {
  const messages = getMessages(lang);
  const m = messages.explorer;
  const allFolderLabel = m.all;
  const rootFolderLabel = m.rootFiles;
  const [selectedFolder, setSelectedFolder] = useState<string>("*");
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
      .sort((a, b) => a[0].localeCompare(b[0], lang))
      .map(([folder, count]) => ({ folder, count }));
  }, [items, lang]);

  const folderTree = useMemo(() => {
    const roots: FolderNode[] = [];

    for (const folderEntry of folders) {
      if (folderEntry.folder === "(root)") {
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
      sortTree(node, lang);
    }
    roots.sort((a, b) => a.name.localeCompare(b.name, lang));
    return roots;
  }, [folders, lang]);

  const defaultExpandedFolders = useMemo(() => {
    const initialExpanded: Record<string, boolean> = {};
    for (const node of folderTree) {
      initialExpanded[node.path] = true;
    }
    return initialExpanded;
  }, [folderTree]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const folder = getFolderPath(item.sourcePath);
      const matchFolder =
        selectedFolder === "*" ||
        (selectedFolder === "(root)"
          ? folder === "(root)"
          : folder === selectedFolder || folder.startsWith(`${selectedFolder}/`));
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
  const hasActiveFilter = selectedFolder !== "*" || typeFilter !== "all" || query.trim().length > 0;
  const rootFilesCount = folders.find((entry) => entry.folder === "(root)")?.count ?? 0;

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

    const isExpanded = expandedFolders[node.path] ?? defaultExpandedFolders[node.path] ?? depth === 0;
    const isActive = selectedFolder === node.path;
    const hasChildren = node.children.length > 0;

    return (
      <li key={node.path} className="space-y-0.5">
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
            isActive ? "app-accent-bg app-accent-text" : "app-hover-muted"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleFolder(node.path)}
            className={`flex h-5 w-5 items-center justify-center rounded ${hasChildren ? "opacity-70 hover:opacity-100" : "opacity-30"}`}
            aria-label={
              hasChildren
                ? m.expandOrCollapse
                : m.noChildren
            }
          >
            {hasChildren ? (
              <IconChevronRight
                className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              />
            ) : (
              <span className="h-1 w-1 rounded-full" style={{ background: 'currentColor' }} />
            )}
          </button>
          <button type="button" onClick={() => setSelectedFolder(node.path)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <IconFolderSmall className={isActive ? "opacity-90" : "app-text-soft"} />
            <span className="truncate text-sm font-medium">{node.name}</span>
            <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${isActive ? "bg-white/20" : "app-muted app-text-soft"}`}>
              {node.totalCount}
            </span>
          </button>
        </div>
        {hasChildren && isExpanded ? <ul className="space-y-0.5">{node.children.map((child) => renderTreeNode(child, depth + 1))}</ul> : null}
      </li>
    );
  }

  const statCards = [
    { label: m.totalFiles, value: items.length, gradient: "var(--ui-stat-gradient-1)", iconColor: "var(--ui-stat-icon-1)", icon: <IconFiles /> },
    { label: messages.common.markdown, value: markdownCount, gradient: "var(--ui-stat-gradient-2)", iconColor: "var(--ui-stat-icon-2)", icon: <IconMarkdown /> },
    { label: messages.common.html, value: htmlCount, gradient: "var(--ui-stat-gradient-3)", iconColor: "var(--ui-stat-icon-3)", icon: <IconCode /> },
    { label: m.sourceFolders, value: folders.length, gradient: "var(--ui-stat-gradient-4)", iconColor: "var(--ui-stat-icon-4)", icon: <IconFolder /> },
  ];

  return (
    <section className="mt-6 space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="app-stat-card" style={{ background: stat.gradient }}>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="app-text-soft text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="app-text mt-1.5 text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', color: stat.iconColor }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Sidebar + File list */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="app-card p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="app-text text-sm font-bold">{m.folders}</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setExpandAll(true)} className="app-button-ghost px-2 py-1 text-xs">
                {m.expandAll}
              </button>
              <button type="button" onClick={() => setExpandAll(false)} className="app-button-ghost px-2 py-1 text-xs">
                {m.collapse}
              </button>
            </div>
          </div>

          {/* Search folders */}
          <div className="relative mb-3">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-text-soft">
              <IconSearch />
            </div>
            <input
              type="text"
              value={folderQuery}
              onChange={(event) => setFolderQuery(event.target.value)}
              placeholder={m.searchFolders}
              className="app-input w-full py-2 pl-9 pr-3 text-sm"
            />
          </div>

          {/* Quick filters */}
          <button type="button" onClick={() => setSelectedFolder("*")} className={`mb-1.5 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${selectedFolder === "*" ? "app-accent-bg app-accent-text" : "app-hover-muted app-text-muted"}`}>
            {allFolderLabel} ({items.length})
          </button>
          <button type="button" onClick={() => setSelectedFolder("(root)")} className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${selectedFolder === "(root)" ? "app-accent-bg app-accent-text" : "app-hover-muted app-text-muted"}`}>
            {rootFolderLabel} ({rootFilesCount})
          </button>

          {/* Folder tree */}
          <div className="max-h-[calc(100%-180px)] overflow-auto pr-1">
            <ul className="space-y-0.5">{folderTree.map((node) => renderTreeNode(node))}</ul>
            {folderTree.length > 0 && folderTree.every((node) => !matchesFolderSearch(node, folderQuery.trim().toLowerCase())) ? (
              <p className="app-warning mt-2 rounded-md px-3 py-2 text-xs">{m.noMatchingFolders}</p>
            ) : null}
          </div>
        </aside>

        {/* File list */}
        <div className="app-card p-4">
          {/* Search + Filter */}
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 app-text-soft">
                <IconSearch />
              </div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={m.searchPlaceholder}
                className="app-input w-full py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | "markdown" | "html")} className="app-input cursor-pointer px-3 py-2 text-sm">
              <option value="all">{m.allFileTypes}</option>
              <option value="markdown">{messages.common.markdown}</option>
              <option value="html">{messages.common.html}</option>
            </select>
          </div>

          {/* Active filters */}
          {hasActiveFilter ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="app-badge">
                {m.folder}: {selectedFolder === "*" ? allFolderLabel : selectedFolder}
              </span>
              <span className="app-badge">
                {m.type}: {typeFilter === "all" ? allFolderLabel : typeFilter}
              </span>
              {query.trim() ? (
                <span className="app-badge">
                  {m.keyword}: {query.trim()}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSelectedFolder("*");
                  setTypeFilter("all");
                  setQuery("");
                }}
                className="app-button-ghost rounded-full px-2 py-1 text-xs font-medium"
              >
                {m.clearFilters}
              </button>
            </div>
          ) : null}

          <p className="app-text-muted mb-3 text-sm">
            {m.showing} <strong>{filteredItems.length}</strong> {m.files}
            {selectedFolder !== "*" ? ` ${m.inFolderPrefix} "${selectedFolder}"` : ""}
            .
          </p>

          {/* File table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="app-table-row-border app-text-soft border-b">
                  <th className="px-3 py-2.5 font-medium">{m.fileName}</th>
                  <th className="px-3 py-2.5 font-medium">{m.type}</th>
                  <th className="px-3 py-2.5 font-medium">{m.size}</th>
                  <th className="px-3 py-2.5 font-medium">{m.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="app-table-row-border app-hover-muted border-b align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0 app-text-soft">
                          <IconFileText />
                        </div>
                        <div className="min-w-0">
                          <p className="app-text font-medium">{item.fileName}</p>
                          <p className="app-text-soft mt-0.5 truncate text-xs">{item.sourcePath}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`app-badge ${item.type === "markdown" ? "app-badge-green" : ""}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="app-text-muted px-3 py-3 font-mono text-xs">{formatSize(item.size)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/reports/${encodeURIComponent(item.id)}?lang=${lang}`} className="app-button-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
                          <IconEye />
                          {m.view}
                        </Link>
                        <a href={item.publicPath} download={item.fileName} className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
                          <IconDownload />
                          {m.download}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 ? (
            <p className="app-warning mt-4 rounded-md px-3 py-2 text-sm">
              {m.noFilesMatched}
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

function sortTree(node: FolderNode, locale: "vi" | "en") {
  node.children.sort((a, b) => a.name.localeCompare(b.name, locale));
  for (const child of node.children) {
    sortTree(child, locale);
  }
}
