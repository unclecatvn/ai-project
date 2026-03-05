"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { AnalysisItem } from "@/features/reports/lib/analysis";
import type { ExplorerNode, ExplorerFolderNode } from "@/features/reports/components/file-browser/types";
import { getMessages } from "@/shared/i18n/messages";
import type { AppLang } from "@/shared/i18n/resolve-language";

/* ─── Shared SVG Icons ─── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ui-accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ui-text-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  const colorMap: Record<string, string> = {
    markdown: "#60a5fa", html: "#f97316", json: "#fbbf24",
    yaml: "#a78bfa", text: "var(--ui-text-soft)",
  };
  const color = colorMap[fileType] ?? "var(--ui-text-soft)";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

/* ─── Menu Icons ─── */

const ICON = {
  open: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  newFile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>,
  newFolder: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>,
  rename: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
  delete: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  copyPath: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
  expand: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>,
  collapse: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  upload: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  close: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

/* ─── Types ─── */

type ContextMenuState = {
  visible: boolean;
  x: number; // viewport clientX (fixed positioning)
  y: number; // viewport clientY (fixed positioning)
  targetPath: string;
  targetKind: "file" | "folder";
  isTabOpen?: boolean;
} | null;

type ExplorerSidebarProps = {
  lang: AppLang;
  tree: ExplorerNode[];
  activeFilePath: string | null;
  onFileSelect: (sourcePath: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => Promise<void> | void;
  onDeleteFile?: (fileId: string, sourcePath: string) => Promise<void>;
  onDeleteFolder?: (folderPath: string) => Promise<void>;
  onRenameFile?: (fileId: string, oldPath: string, newName: string) => Promise<void>;
  itemsByPath?: Map<string, AnalysisItem>;
  openTabs?: string[];
  onCloseTabFromSidebar?: (sourcePath: string) => void;
};

/* ─── Inline Input ─── */

function InlineInput({
  placeholder,
  onSubmit,
  onCancel,
  icon,
  initialValue,
}: {
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  icon: ReactNode;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select text on mount
    inputRef.current?.focus();
    if (initialValue) inputRef.current?.select();
  }, [initialValue]);

  return (
    <div className="explorer-inline-input">
      {icon}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="explorer-inline-input__field"
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit(value.trim());
          else if (e.key === "Escape") onCancel();
        }}
        onBlur={() => setTimeout(() => { if (!value.trim()) onCancel(); }, 150)}
      />
      <button type="button" onClick={() => { if (value.trim()) onSubmit(value.trim()); }} className="explorer-inline-input__ok" title="Confirm">
        {ICON.check}
      </button>
      <button type="button" onClick={onCancel} className="explorer-inline-input__cancel" title="Cancel">
        {ICON.close}
      </button>
    </div>
  );
}

/* ─── Context Menu ─── */

function ContextMenu({
  menu,
  onClose,
  onAction,
}: {
  menu: NonNullable<ContextMenuState>;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const isFolder = menu.targetKind === "folder";
  const isTabOpen = menu.isTabOpen ?? false;

  type MenuItem = { key: string; label: string; icon: ReactNode; dividerBefore?: boolean; danger?: boolean };
  const items: MenuItem[] = isFolder
    ? [
        { key: "newFile", label: "New File", icon: ICON.newFile },
        { key: "newFolder", label: "New Folder", icon: ICON.newFolder },
        { key: "rename", label: "Rename", icon: ICON.rename, dividerBefore: true },
        { key: "delete", label: "Delete", icon: ICON.delete, danger: true },
        { key: "copyPath", label: "Copy Path", icon: ICON.copyPath, dividerBefore: true },
      ]
    : [
        { key: "open", label: "Open", icon: ICON.open },
        ...(isTabOpen ? [{ key: "closeTab", label: "Close Tab", icon: ICON.close }] : []),
        { key: "rename", label: "Rename", icon: ICON.rename, dividerBefore: true },
        { key: "delete", label: "Delete", icon: ICON.delete, danger: true },
        { key: "copyPath", label: "Copy Path", icon: ICON.copyPath, dividerBefore: true },
      ];

  return (
    <div ref={menuRef} className="explorer-context-menu" style={{ position: "fixed", top: menu.y, left: menu.x }}>
      {items.map((item) => (
        <div key={item.key}>
          {item.dividerBefore ? <div className="explorer-context-menu__divider" /> : null}
          <button
            type="button"
            className={`explorer-context-menu__item ${item.danger ? "explorer-context-menu__item--danger" : ""}`}
            onClick={() => { onAction(item.key); onClose(); }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export function ExplorerSidebar({
  lang,
  tree,
  activeFilePath,
  onFileSelect,
  searchQuery,
  onSearchChange,
  onRefresh,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  itemsByPath,
  openTabs = [],
  onCloseTabFromSidebar,
}: ExplorerSidebarProps) {
  const m = getMessages(lang).explorer;
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [createMode, setCreateMode] = useState<"folder" | "file" | null>(null);
  const [createParent, setCreateParent] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const q = searchQuery.trim().toLowerCase();

  /* ─── Tree helpers ─── */

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  function expandAll(expanded: boolean) {
    const next: Record<string, boolean> = {};
    const walk = (nodes: ExplorerNode[]) => {
      for (const node of nodes) {
        if (node.kind === "folder") {
          next[node.path] = expanded;
          walk(node.children);
        }
      }
    };
    walk(tree);
    setExpandedFolders(next);
  }

  function matchesSearch(node: ExplorerNode): boolean {
    if (!q) return true;
    if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) return true;
    if (node.kind === "folder") return node.children.some(matchesSearch);
    return false;
  }

  /* ─── Context Menu ─── */

  function showContextMenu(e: React.MouseEvent, node: ExplorerNode) {
    e.preventDefault();
    e.stopPropagation();
    // Use viewport coordinates with fixed positioning (avoids overflow:hidden clipping)
    const menuWidth = 200;
    const menuHeight = 220;
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - menuWidth),
      y: Math.min(e.clientY, window.innerHeight - menuHeight),
      targetPath: node.path,
      targetKind: node.kind,
      isTabOpen: node.kind === "file" && openTabs.includes(node.path),
    });
  }

  function showRootContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const menuWidth = 200;
    const menuHeight = 150;
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - menuWidth),
      y: Math.min(e.clientY, window.innerHeight - menuHeight),
      targetPath: "",
      targetKind: "folder",
      isTabOpen: false,
    });
  }

  async function handleContextAction(action: string) {
    if (!contextMenu) return;
    const { targetPath, targetKind } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case "open":
        onFileSelect(targetPath);
        break;
      case "closeTab":
        onCloseTabFromSidebar?.(targetPath);
        break;
      case "newFile":
        // targetPath "" means root level
        startCreateInFolder(targetPath || null, "file");
        break;
      case "newFolder":
        startCreateInFolder(targetPath || null, "folder");
        break;
      case "rename":
        setRenameTarget(targetPath);
        break;
      case "copyPath":
        await navigator.clipboard.writeText(targetPath).catch(() => {});
        break;
      case "delete":
        await handleDelete(targetPath, targetKind);
        break;
    }
  }

  /* ─── Delete (uses IDs from itemsByPath — no extra API call) ─── */

  async function handleDelete(path: string, kind: string) {
    const name = path.split("/").pop() ?? path;
    const confirmMsg = kind === "folder"
      ? `Delete folder "${name}" and all its contents?`
      : `Delete file "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    if (kind === "folder") {
      await onDeleteFolder?.(path);
    } else {
      const item = itemsByPath?.get(path);
      if (item?.id) {
        await onDeleteFile?.(item.id, path);
      }
    }
  }

  /* ─── Rename (uses IDs from itemsByPath — no extra API call) ─── */

  async function handleRename(oldPath: string, newName: string) {
    const item = itemsByPath?.get(oldPath);
    if (item?.id) {
      await onRenameFile?.(item.id, oldPath, newName);
    }
    setRenameTarget(null);
  }

  /* ─── Create ─── */

  async function handleCreateFolder(name: string) {
    try {
      const res = await fetch("/api/file-manager/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: createParent }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch { /* keep open */ }
    setCreateMode(null);
    setCreateParent(null);
    await onRefresh?.();
  }

  async function handleCreateFile(name: string) {
    const fileName = /\.\w+$/.test(name) ? name : `${name}.md`;
    const fileType = fileName.endsWith(".html") ? "html" : fileName.endsWith(".json") ? "json" : "markdown";
    const sourcePath = createParent ? `${createParent}/${fileName}` : fileName;
    try {
      const res = await fetch("/api/file-manager/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName.replace(/\.[^.]+$/, ""),
          file_name: fileName,
          source_path: sourcePath,
          file_type: fileType,
          content: `# ${fileName.replace(/\.[^.]+$/, "")}\n`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch { /* keep open */ }
    setCreateMode(null);
    setCreateParent(null);
    await onRefresh?.();
  }

  function startCreateInFolder(folderPath: string | null, mode: "folder" | "file") {
    setCreateMode(mode);
    setCreateParent(folderPath);
    if (folderPath) setExpandedFolders((prev) => ({ ...prev, [folderPath]: true }));
  }

  /* ─── Drag & Drop ─── */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploadStatus(`Uploading ${files.length} file(s)...`);
    let successCount = 0;

    for (const file of files) {
      try {
        const content = await file.text();
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const fileType = ext === "html" ? "html" : ext === "json" ? "json" : ext === "yaml" || ext === "yml" ? "yaml" : "markdown";

        const res = await fetch("/api/file-manager/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^.]+$/, ""),
            file_name: file.name,
            source_path: `uploads/${file.name}`,
            file_type: fileType,
            content,
          }),
        });
        if (res.ok) successCount++;
      } catch { /* skip */ }
    }

    setUploadStatus(`✓ ${successCount}/${files.length} uploaded`);
    setTimeout(() => setUploadStatus(null), 3000);
    if (successCount > 0) await onRefresh?.();
  }, [onRefresh]);

  /* ─── Render tree node ─── */

  function renderNode(node: ExplorerNode, depth = 0): ReactNode {
    if (!matchesSearch(node)) return null;
    const indent = depth * 16 + 8;

    // ─ File node ─
    if (node.kind === "file") {
      if (renameTarget === node.path) {
        return (
          <li key={node.path}>
            <div style={{ paddingLeft: `${indent + 20}px` }}>
              <InlineInput
                placeholder="New name..."
                initialValue={node.name}
                onSubmit={(newName) => handleRename(node.path, newName)}
                onCancel={() => setRenameTarget(null)}
                icon={<FileIcon fileType={node.fileType} />}
              />
            </div>
          </li>
        );
      }

      return (
        <li key={node.path}>
          <button
            type="button"
            onClick={() => onFileSelect(node.path)}
            onContextMenu={(e) => showContextMenu(e, node)}
            className={`explorer-item ${activeFilePath === node.path ? "explorer-item--active" : ""}`}
            style={{ paddingLeft: `${indent + 20}px` }}
            title={node.path}
          >
            <FileIcon fileType={node.fileType} />
            <span className="explorer-item__name">{node.name}</span>
          </button>
        </li>
      );
    }

    // ─ Folder node ─
    const isExpanded = expandedFolders[node.path] ?? depth < 1;
    const folderNode = node as ExplorerFolderNode;
    const showCreateHere = createMode && createParent === node.path;

    if (renameTarget === node.path) {
      return (
        <li key={node.path}>
          <div style={{ paddingLeft: `${indent}px` }}>
            <InlineInput
              placeholder="New name..."
              initialValue={node.name}
              onSubmit={(newName) => handleRename(node.path, newName)}
              onCancel={() => setRenameTarget(null)}
              icon={<FolderIcon open={false} />}
            />
          </div>
        </li>
      );
    }

    return (
      <li key={node.path}>
        <div className="explorer-item-row">
          <button
            type="button"
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => showContextMenu(e, node)}
            className="explorer-item explorer-item--folder"
            style={{ paddingLeft: `${indent}px` }}
            title={node.path}
          >
            <ChevronIcon open={isExpanded} />
            <FolderIcon open={isExpanded} />
            <span className="explorer-item__name">{node.name}</span>
            <span className="explorer-item__count">{folderNode.fileCount}</span>
          </button>
          <div className="explorer-item-actions">
            <button type="button" onClick={(e) => { e.stopPropagation(); startCreateInFolder(node.path, "file"); }} className="explorer-action-btn-mini" title="New file">
              {ICON.newFile}
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); startCreateInFolder(node.path, "folder"); }} className="explorer-action-btn-mini" title="New folder">
              {ICON.newFolder}
            </button>
          </div>
        </div>
        {isExpanded ? (
          <ul className="explorer-tree__list">
            {showCreateHere ? (
              <li>
                <div style={{ paddingLeft: `${indent + 20}px` }}>
                  <InlineInput
                    placeholder={createMode === "folder" ? "Folder name..." : "File name..."}
                    onSubmit={createMode === "folder" ? handleCreateFolder : handleCreateFile}
                    onCancel={() => { setCreateMode(null); setCreateParent(null); }}
                    icon={createMode === "folder" ? <FolderIcon open={false} /> : <FileIcon fileType="markdown" />}
                  />
                </div>
              </li>
            ) : null}
            {folderNode.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  /* ─── Render ─── */

  return (
    <aside
      ref={sidebarRef}
      className={`explorer-sidebar ${isDragOver ? "explorer-sidebar--dragover" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={showRootContextMenu}
    >
      {/* Header */}
      <div className="explorer-sidebar__header">
        <span className="explorer-sidebar__title">EXPLORER</span>
        <div className="explorer-sidebar__actions">
          <button type="button" onClick={() => startCreateInFolder(null, "file")} className="explorer-action-btn" title="New file">{ICON.newFile}</button>
          <button type="button" onClick={() => startCreateInFolder(null, "folder")} className="explorer-action-btn" title="New folder">{ICON.newFolder}</button>
          <button type="button" onClick={() => expandAll(true)} className="explorer-action-btn" title={m.expandAll}>{ICON.expand}</button>
          <button type="button" onClick={() => expandAll(false)} className="explorer-action-btn" title={m.collapse}>{ICON.collapse}</button>
          {onRefresh ? <button type="button" onClick={() => onRefresh()} className="explorer-action-btn" title="Refresh">{ICON.refresh}</button> : null}
        </div>
      </div>

      {/* Search */}
      <div className="explorer-sidebar__search">
        {ICON.search}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={m.searchPlaceholder}
          className="explorer-search-input"
        />
      </div>

      {/* Root create input */}
      {createMode && createParent === null ? (
        <div className="explorer-root-create">
          <InlineInput
            placeholder={createMode === "folder" ? "Folder name..." : "File name..."}
            onSubmit={createMode === "folder" ? handleCreateFolder : handleCreateFile}
            onCancel={() => { setCreateMode(null); setCreateParent(null); }}
            icon={createMode === "folder" ? <FolderIcon open={false} /> : <FileIcon fileType="markdown" />}
          />
        </div>
      ) : null}

      {/* Tree */}
      <nav className="explorer-tree" aria-label="File explorer">
        <ul className="explorer-tree__list">
          {tree.map((node) => renderNode(node))}
        </ul>
        {tree.length === 0 ? <p className="explorer-empty">{m.noFilesMatched}</p> : null}
      </nav>

      {/* Upload status */}
      {uploadStatus ? <div className="explorer-upload-status">{uploadStatus}</div> : null}

      {/* Drag overlay */}
      {isDragOver ? (
        <div className="explorer-drop-overlay">
          {ICON.upload}
          <span>Drop files to upload</span>
        </div>
      ) : null}

      {/* Context menu */}
      {contextMenu?.visible ? (
        <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} onAction={handleContextAction} />
      ) : null}
    </aside>
  );
}
