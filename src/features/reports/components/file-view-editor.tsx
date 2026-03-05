"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportMarkdown } from "@/features/reports/components/report-markdown";
import { MarkdownEditor } from "@/features/reports/components/markdown-editor";
import { getMessages } from "@/shared/i18n/messages";

type FileViewEditorProps = {
  fileId: string;
  initialContent: string;
  lang: "vi" | "en";
  publicPath: string;
  fileType: string;
};

function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function FileViewEditor({ fileId, initialContent, lang, publicPath, fileType }: FileViewEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(initialContent);
  const router = useRouter();
  const m = getMessages(lang).markdown;

  const handleSave = useCallback((savedContent: string) => {
    setCurrentContent(savedContent);
    // Refresh the page to pick up the new content from server
    router.refresh();
    setIsEditing(false);
  }, [router]);

  const handleCancel = useCallback(() => {
    setCurrentContent(initialContent);
    setIsEditing(false);
  }, [initialContent]);

  if (isEditing) {
    return (
      <MarkdownEditor
        fileId={fileId}
        initialContent={currentContent}
        lang={lang}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  const isMarkdown = fileType === "markdown";

  return (
    <div>
      {/* Edit button */}
      {isMarkdown && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <IconEdit />
            {m.editFile}
          </button>
        </div>
      )}

      {/* Viewer */}
      {fileType === "html" ? (
        <iframe
          srcDoc={currentContent}
          title="File content"
          className="app-card h-[80vh] w-full"
          sandbox="allow-scripts"
        />
      ) : currentContent ? (
        <MarkdownFromContent content={currentContent} lang={lang} publicPath={publicPath} />
      ) : (
        <p className="app-text-soft text-sm">No content available.</p>
      )}
    </div>
  );
}

function MarkdownFromContent({ content, lang, publicPath }: { content: string; lang: "vi" | "en"; publicPath: string }) {
  // Use publicPath if available, otherwise encode content as data URL
  const mdPath = publicPath || `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(content)))}`;
  return <ReportMarkdown publicPath={mdPath} lang={lang} />;
}
