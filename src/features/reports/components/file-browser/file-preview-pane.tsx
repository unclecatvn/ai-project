"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { AnalysisItem } from "@/features/reports/lib/analysis";
import { formatSize, getBreadcrumbs } from "@/features/reports/components/file-browser/helpers";
import { getMessages } from "@/shared/i18n/messages";
import type { AppLang } from "@/shared/i18n/resolve-language";
import type { EditorTab } from "@/features/reports/components/file-browser/types";

const ReportMarkdown = dynamic(
  async () => (await import("@/features/reports/components/report-markdown")).ReportMarkdown,
  { ssr: false },
);

/* ─── SVG Icons ─── */

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FileTabIcon({ fileType }: { fileType: string }) {
  const colorMap: Record<string, string> = {
    markdown: "#60a5fa",
    html: "#f97316",
    json: "#fbbf24",
    yaml: "#a78bfa",
    text: "var(--ui-text-soft)",
  };
  const color = colorMap[fileType] ?? "var(--ui-text-soft)";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

/* ─── Tab Context Menu ─── */

type TabMenu = { x: number; y: number; sourcePath: string } | null;

function TabContextMenu({
  menu,
  tabs,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseToRight,
  onCloseAll,
}: {
  menu: NonNullable<TabMenu>;
  tabs: EditorTab[];
  onClose: () => void;
  onCloseTab: (sp: string) => void;
  onCloseOthers: (sp: string) => void;
  onCloseToRight: (sp: string) => void;
  onCloseAll: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = tabs.findIndex((t) => t.sourcePath === menu.sourcePath);
  const hasOthers = tabs.length > 1;
  const hasRight = idx >= 0 && idx < tabs.length - 1;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  type Item = { label: string; disabled?: boolean; danger?: boolean; divider?: boolean; action: () => void };
  const items: Item[] = [
    { label: "Close Tab", action: () => { onCloseTab(menu.sourcePath); onClose(); } },
    { label: "Close Others", disabled: !hasOthers, action: () => { onCloseOthers(menu.sourcePath); onClose(); } },
    { label: "Close to the Right", disabled: !hasRight, action: () => { onCloseToRight(menu.sourcePath); onClose(); } },
    { label: "Close All", action: () => { onCloseAll(); onClose(); }, divider: true },
    {
      label: "Copy Path",
      action: () => { navigator.clipboard.writeText(menu.sourcePath).catch(() => {}); onClose(); },
    },
  ];

  return (
    <div
      ref={ref}
      className="explorer-context-menu"
      style={{ position: "fixed", top: menu.y, left: menu.x, zIndex: 200 }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.divider ? <div className="explorer-context-menu__divider" /> : null}
          <button
            type="button"
            className={`explorer-context-menu__item ${item.danger ? "explorer-context-menu__item--danger" : ""} ${item.disabled ? "explorer-context-menu__item--disabled" : ""}`}
            onClick={item.disabled ? undefined : item.action}
            disabled={item.disabled}
          >
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Types ─── */

type EditorPaneProps = {
  lang: AppLang;
  tabs: EditorTab[];
  activeTab: string | null;
  onSelectTab: (sourcePath: string) => void;
  onCloseTab: (sourcePath: string) => void;
  onCloseOthers: (sourcePath: string) => void;
  onCloseToRight: (sourcePath: string) => void;
  onCloseAll: () => void;
  item: AnalysisItem | null;
  loading: boolean;
};

/* ─── Component ─── */

export function EditorPane({
  lang,
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onCloseOthers,
  onCloseToRight,
  onCloseAll,
  item,
  loading,
}: EditorPaneProps) {
  const m = getMessages(lang).explorer;
  const [tabMenu, setTabMenu] = useState<TabMenu>(null);

  const toBase64 = (value: string) => {
    if (typeof window === "undefined") return "";
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return window.btoa(binary);
  };

  /* ─── Empty state ─── */
  if (tabs.length === 0) {
    return (
      <div className="editor-pane">
        <div className="editor-pane__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ui-text-soft)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="editor-pane__empty-text">{m.selectFilePreview}</p>
        </div>
      </div>
    );
  }

  /* ─── Breadcrumbs ─── */
  const breadcrumbs = item ? getBreadcrumbs(item.sourcePath) : [];

  return (
    <div className="editor-pane">
      {/* Tab bar */}
      <div className="editor-tabs">
        <div className="editor-tabs__scroll">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.sourcePath;
            return (
              <div
                key={tab.sourcePath}
                className={`editor-tab ${isActive ? "editor-tab--active" : ""}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabMenu({ x: e.clientX, y: e.clientY, sourcePath: tab.sourcePath });
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.sourcePath)}
                  className="editor-tab__label"
                  title={tab.sourcePath}
                >
                  <FileTabIcon fileType={tab.fileType} />
                  <span className="editor-tab__name">{tab.fileName}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.sourcePath); }}
                  className="editor-tab__close"
                  title="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab context menu */}
      {tabMenu ? (
        <TabContextMenu
          menu={tabMenu}
          tabs={tabs}
          onClose={() => setTabMenu(null)}
          onCloseTab={onCloseTab}
          onCloseOthers={onCloseOthers}
          onCloseToRight={onCloseToRight}
          onCloseAll={onCloseAll}
        />
      ) : null}

      {/* Breadcrumb */}
      {breadcrumbs.length > 1 ? (
        <div className="editor-breadcrumb">
          {breadcrumbs.map((segment, idx) => (
            <span key={idx} className="editor-breadcrumb__segment">
              {idx > 0 ? <span className="editor-breadcrumb__separator">/</span> : null}
              <span className={idx === breadcrumbs.length - 1 ? "editor-breadcrumb__active" : ""}>{segment}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* Content */}
      <div className="editor-content">
        {loading ? (
          <div className="editor-content__loading">
            <div className="editor-spinner" />
            <span>{m.loadingPreview}</span>
          </div>
        ) : item ? (
          <div className="editor-content__body">
            {item.type === "html" ? (
              <iframe
                srcDoc={item.content ?? ""}
                title={item.title}
                className="editor-iframe"
                sandbox="allow-scripts"
              />
            ) : item.content ? (
              <ReportMarkdown
                publicPath={`data:text/markdown;base64,${toBase64(item.content)}`}
                lang={lang}
              />
            ) : (
              <pre className="editor-no-content">
                <code>No content available</code>
              </pre>
            )}
          </div>
        ) : (
          <div className="editor-pane__empty">
            <p className="editor-pane__empty-text">{m.selectFilePreview}</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      {item ? (
        <div className="editor-statusbar">
          <span className="editor-statusbar__item">{item.type}</span>
          <span className="editor-statusbar__divider">·</span>
          <span className="editor-statusbar__item">{formatSize(item.size)}</span>
          <span className="editor-statusbar__divider">·</span>
          <span className="editor-statusbar__item">{item.sensitivity}</span>
          <div className="editor-statusbar__spacer" />
          <a
            href={`/reports/${encodeURIComponent(item.sourcePath)}?lang=${lang}`}
            className="editor-statusbar__link"
          >
            {m.view}
          </a>
          <a
            href={`/api/file-manager/files/download?source_path=${encodeURIComponent(item.sourcePath)}&download=1`}
            download={item.fileName}
            className="editor-statusbar__link"
          >
            {m.download}
          </a>
        </div>
      ) : null}
    </div>
  );
}
