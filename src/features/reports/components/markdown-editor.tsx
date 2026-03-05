"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMessages } from "@/shared/i18n/messages";

type MarkdownEditorProps = {
  fileId: string;
  initialContent: string;
  lang: "vi" | "en";
  onSave?: (savedContent: string) => void;
  onCancel: () => void;
};

type FileHistoryItem = {
  id: number;
  action: "file_updated" | "file_rollback";
  before_state: { content?: string } | null;
  after_state: { content?: string } | null;
  created_at: string;
};

function toPreview(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "(empty)";
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

/* ─── Icons ─── */

function IconSave() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Main Component ─── */

export function MarkdownEditor({ fileId, initialContent, lang, onSave, onCancel }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [historyState, setHistoryState] = useState<"idle" | "loading" | "error">("idle");
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<FileHistoryItem[]>([]);
  const [rollbackingId, setRollbackingId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const m = getMessages(lang).markdown;

  const isDirty = content !== initialContent;

  const markdownComponents: Components = useMemo(
    () => ({
      pre({ children, ...props }) {
        return <pre {...props}>{children}</pre>;
      },
    }),
    [],
  );

  const loadHistory = useCallback(async () => {
    setHistoryState("loading");
    setHistoryError("");
    try {
      const response = await fetch(`/api/file-manager/files/${fileId}/history?limit=20`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setHistoryItems(Array.isArray(data.logs) ? data.logs : []);
      setHistoryState("idle");
    } catch (err) {
      setHistoryState("error");
      setHistoryError(err instanceof Error ? err.message : "Failed to load history");
    }
  }, [fileId]);

  const handleSave = useCallback(async () => {
    if (saveState === "saving") return;
    setSaveState("saving");
    setErrorMsg("");

    try {
      const response = await fetch(`/api/file-manager/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      onSave?.(content);
      await loadHistory();
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, [content, fileId, loadHistory, onSave, saveState]);

  const handleRollback = useCallback(async (item: FileHistoryItem) => {
    if (rollbackingId !== null) return;
    const message =
      lang === "vi"
        ? "Bạn có chắc muốn rollback về mốc này không?"
        : "Are you sure you want to rollback to this version?";
    if (!window.confirm(message)) return;

    setRollbackingId(item.id);
    setSaveState("saving");
    setErrorMsg("");
    try {
      const response = await fetch(`/api/file-manager/files/${fileId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ change_log_id: item.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const newContent = (data.file?.content ?? "") as string;
      setContent(newContent);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      onSave?.(newContent);
      await loadHistory();
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRollbackingId(null);
    }
  }, [fileId, lang, loadHistory, onSave, rollbackingId]);

  // Cmd/Ctrl+S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Tab key support in textarea
  const handleKeyDownTextarea = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = content.substring(0, start) + "  " + content.substring(end);
      setContent(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [content]);

  return (
    <div className="markdown-editor">
      {/* Toolbar */}
      <div className="markdown-editor__toolbar">
        <div className="markdown-editor__toolbar-left">
          <span className="markdown-editor__label">{m.editing}</span>
          {isDirty && (
            <span className="markdown-editor__dirty">
              <span className="markdown-editor__dirty-dot" />
              {m.unsavedChanges}
            </span>
          )}
          {saveState === "saved" && (
            <span className="markdown-editor__saved">
              <IconCheck /> {m.saved}
            </span>
          )}
          {saveState === "error" && (
            <span className="markdown-editor__error">
              {m.saveFailed}: {errorMsg}
            </span>
          )}
        </div>
        <div className="markdown-editor__toolbar-right">
          <button
            type="button"
            onClick={onCancel}
            className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <IconX /> {m.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving" || !isDirty}
            className="app-button-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <IconSave /> {saveState === "saving" ? m.saving : m.save}
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="markdown-editor__panes">
        {/* Editor */}
        <div className="markdown-editor__editor-pane">
          <div className="markdown-editor__pane-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Markdown
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDownTextarea}
            className="markdown-editor__textarea"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="markdown-editor__preview-pane">
          <div className="markdown-editor__pane-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {m.preview}
          </div>
          <div className="markdown-editor__preview markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="markdown-editor__history">
        <div className="markdown-editor__history-head">
          <strong>{lang === "vi" ? "Lịch sử thay đổi" : "Change history"}</strong>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="app-button-secondary inline-flex items-center gap-1.5 px-2 py-1 text-xs"
            disabled={historyState === "loading"}
          >
            {historyState === "loading" ? (lang === "vi" ? "Đang tải..." : "Loading...") : (lang === "vi" ? "Làm mới" : "Refresh")}
          </button>
        </div>
        {historyState === "error" ? (
          <p className="markdown-editor__history-error">{historyError}</p>
        ) : historyItems.length === 0 ? (
          <p className="markdown-editor__history-empty">{lang === "vi" ? "Chưa có lịch sử thay đổi." : "No changes yet."}</p>
        ) : (
          <ul className="markdown-editor__history-list">
            {historyItems.map((item) => {
              const before = item.before_state?.content ?? "";
              const after = item.after_state?.content ?? "";
              return (
                <li key={item.id} className="markdown-editor__history-item">
                  <div className="markdown-editor__history-item-top">
                    <span className="markdown-editor__history-time">
                      {new Date(item.created_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
                    </span>
                    <span className="markdown-editor__history-action">
                      {item.action === "file_rollback"
                        ? (lang === "vi" ? "Rollback" : "Rollback")
                        : (lang === "vi" ? "Chỉnh sửa" : "Edited")}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleRollback(item)}
                      className="app-button-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                      disabled={rollbackingId !== null}
                    >
                      {rollbackingId === item.id
                        ? (lang === "vi" ? "Đang rollback..." : "Rolling back...")
                        : (lang === "vi" ? "Rollback về đây" : "Rollback")}
                    </button>
                  </div>
                  <div className="markdown-editor__history-diff">
                    <div>
                      <div className="markdown-editor__history-label">{lang === "vi" ? "Trước" : "Before"}</div>
                      <pre>{toPreview(before)}</pre>
                    </div>
                    <div>
                      <div className="markdown-editor__history-label">{lang === "vi" ? "Sau" : "After"}</div>
                      <pre>{toPreview(after)}</pre>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
