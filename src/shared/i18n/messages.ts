import type { AppLang } from "@/shared/i18n/resolve-language";

type MessageSchema = {
  common: {
    appName: string;
    markdown: string;
    html: string;
  };
  controls: {
    language: string;
    dark: string;
    light: string;
    vietnamese: string;
    english: string;
  };
  home: {
    title: string;
    description: string;
    total: string;
    files: string;
    emptySync: string;
  };
  reportPage: {
    back: string;
    source: string;
    downloadFile: string;
    openSourceFile: string;
  };
  explorer: {
    all: string;
    rootFiles: string;
    expandOrCollapse: string;
    noChildren: string;
    totalFiles: string;
    sourceFolders: string;
    folders: string;
    expandAll: string;
    collapse: string;
    searchFolders: string;
    noMatchingFolders: string;
    searchPlaceholder: string;
    allFileTypes: string;
    folder: string;
    type: string;
    keyword: string;
    clearFilters: string;
    showing: string;
    inFolderPrefix: string;
    files: string;
    fileName: string;
    size: string;
    actions: string;
    view: string;
    download: string;
    noFilesMatched: string;
  };
  markdown: {
    cannotRenderMermaid: string;
    renderingDiagram: string;
    cannotLoadFile: string;
    loadingContent: string;
    tableOfContents: string;
    displayMode: string;
    rendered: string;
    raw: string;
    copyMarkdown: string;
    copyRaw: string;
    copied: string;
    openToc: string;
    metadata: string;
  };
};

export const messages: Record<AppLang, MessageSchema> = {
  en: {
    common: {
      appName: "Report Viewer",
      markdown: "Markdown",
      html: "HTML",
    },
    controls: {
      language: "Language",
      dark: "Dark",
      light: "Light",
      vietnamese: "Vietnamese",
      english: "English",
    },
    home: {
      title: "Analysis Report Viewer",
      description: "List of Markdown/HTML files auto-scanned from the source project for quick local and Vercel preview.",
      total: "Total",
      files: "files",
      emptySync: "No files are synced yet. Run `npm run predev` again to refresh the list.",
    },
    reportPage: {
      back: "← Back to list",
      source: "Source",
      downloadFile: "Download file",
      openSourceFile: "Open source file",
    },
    explorer: {
      all: "All",
      rootFiles: "Root files",
      expandOrCollapse: "Expand/collapse child folders",
      noChildren: "Folder has no children",
      totalFiles: "Total files",
      sourceFolders: "Source folders",
      folders: "Folders",
      expandAll: "Expand all",
      collapse: "Collapse",
      searchFolders: "Search folders...",
      noMatchingFolders: "No matching folders.",
      searchPlaceholder: "Search by file name, title, path...",
      allFileTypes: "All file types",
      folder: "Folder",
      type: "Type",
      keyword: "Keyword",
      clearFilters: "Clear filters",
      showing: "Showing",
      inFolderPrefix: "in folder",
      files: "files",
      fileName: "File name",
      size: "Size",
      actions: "Actions",
      view: "View",
      download: "Download",
      noFilesMatched: "No files match current filters.",
    },
    markdown: {
      cannotRenderMermaid: "Cannot render Mermaid diagram.",
      renderingDiagram: "Rendering diagram...",
      cannotLoadFile: "Cannot load file content.",
      loadingContent: "Loading content...",
      tableOfContents: "Table of contents",
      displayMode: "Display mode",
      rendered: "Rendered",
      raw: "Raw Markdown",
      copyMarkdown: "Copy Markdown",
      copyRaw: "Copy Raw",
      copied: "Copied",
      openToc: "Open table of contents",
      metadata: "Document metadata",
    },
  },
  vi: {
    common: {
      appName: "Trình xem báo cáo",
      markdown: "Markdown",
      html: "HTML",
    },
    controls: {
      language: "Ngôn ngữ",
      dark: "Tối",
      light: "Sáng",
      vietnamese: "Tiếng Việt",
      english: "English",
    },
    home: {
      title: "Trình xem báo cáo phân tích",
      description: "Danh sách file Markdown/HTML được tự động quét từ project gốc để xem nhanh trên local và Vercel.",
      total: "Tổng cộng",
      files: "file",
      emptySync: "Chưa có file nào được đồng bộ. Hãy chạy lại `npm run predev` để cập nhật danh sách file.",
    },
    reportPage: {
      back: "← Quay lại danh sách",
      source: "Nguồn",
      downloadFile: "Tải file",
      openSourceFile: "Mở file gốc",
    },
    explorer: {
      all: "Tất cả",
      rootFiles: "File ở gốc",
      expandOrCollapse: "Mở/đóng thư mục con",
      noChildren: "Thư mục không có nhánh con",
      totalFiles: "Tổng số file",
      sourceFolders: "Thư mục nguồn",
      folders: "Thư mục",
      expandAll: "Mở hết",
      collapse: "Thu gọn",
      searchFolders: "Tìm thư mục...",
      noMatchingFolders: "Không có thư mục phù hợp.",
      searchPlaceholder: "Tìm theo tên file, tiêu đề, đường dẫn...",
      allFileTypes: "Tất cả loại file",
      folder: "Thư mục",
      type: "Loại",
      keyword: "Từ khóa",
      clearFilters: "Xóa bộ lọc",
      showing: "Hiển thị",
      inFolderPrefix: "trong thư mục",
      files: "file",
      fileName: "Tên file",
      size: "Dung lượng",
      actions: "Thao tác",
      view: "Xem",
      download: "Tải",
      noFilesMatched: "Không tìm thấy file phù hợp với bộ lọc hiện tại.",
    },
    markdown: {
      cannotRenderMermaid: "Không render được sơ đồ Mermaid.",
      renderingDiagram: "Đang render sơ đồ...",
      cannotLoadFile: "Không thể tải nội dung file.",
      loadingContent: "Đang tải nội dung...",
      tableOfContents: "Mục lục",
      displayMode: "Kiểu hiển thị",
      rendered: "Bản dựng",
      raw: "Raw Markdown",
      copyMarkdown: "Copy Markdown",
      copyRaw: "Copy Raw",
      copied: "Đã copy",
      openToc: "Mở mục lục",
      metadata: "Thông tin tài liệu",
    },
  },
};

export function getMessages(lang: AppLang) {
  return messages[lang];
}
