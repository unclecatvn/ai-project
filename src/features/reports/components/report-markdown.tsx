"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMessages } from "@/shared/i18n/messages";

type ReportMarkdownProps = {
  publicPath: string;
  lang: "vi" | "en";
};

type FrontmatterData = Record<string, string>;

type TocItem = {
  level: number;
  text: string;
  id: string;
};

const ANCHOR_OFFSET_PX = 96;

/* ─── SVG Icons ─── */

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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

function IconClipboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

/* ─── CodeBlock with Copy Button ─── */

function CodeBlockWithCopy({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [code]);

  return (
    <div className="code-block-wrapper">
      <div className="app-code-header">
        <span className="font-mono" style={{ color: 'var(--ui-text-soft)' }}>
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`app-code-copy-btn ${copied ? "app-code-copy-btn-copied" : ""}`}
        >
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre>
        <code className={language ? `language-${language}` : ""}>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Helpers ─── */

function slugify(text: string) {
  return text
    .replace(/[Đđ]/g, (char) => (char === "Đ" ? "D" : "d"))
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[''`"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .trim()
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function safeDecodeHash(rawHash: string) {
  try {
    return decodeURIComponent(rawHash);
  } catch {
    return rawHash;
  }
}

function getMermaidThemeConfig(theme: "light" | "dark") {
  if (theme === "dark") {
    return {
      theme: "base" as const,
      themeVariables: {
        background: "#0f172a",
        fontFamily: "Arial, Helvetica, sans-serif",
        primaryColor: "#1e293b",
        primaryTextColor: "#f8fafc",
        primaryBorderColor: "#64748b",
        secondaryColor: "#111827",
        secondaryTextColor: "#e2e8f0",
        secondaryBorderColor: "#475569",
        tertiaryColor: "#0b1220",
        tertiaryTextColor: "#e2e8f0",
        tertiaryBorderColor: "#334155",
        lineColor: "#94a3b8",
        edgeLabelBackground: "#0b1220",
        clusterBkg: "#0b1220",
        clusterBorder: "#334155",
        mainBkg: "#1e293b",
        secondBkg: "#111827",
        tertiaryBkg: "#0b1220",
      },
    };
  }

  return {
    theme: "base" as const,
    themeVariables: {
      background: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      primaryColor: "#f8fafc",
      primaryTextColor: "#0f172a",
      primaryBorderColor: "#94a3b8",
      secondaryColor: "#eef2ff",
      secondaryTextColor: "#0f172a",
      secondaryBorderColor: "#94a3b8",
      tertiaryColor: "#f1f5f9",
      tertiaryTextColor: "#0f172a",
      tertiaryBorderColor: "#cbd5e1",
      lineColor: "#475569",
      edgeLabelBackground: "#ffffff",
      clusterBkg: "#f8fafc",
      clusterBorder: "#cbd5e1",
      mainBkg: "#f8fafc",
      secondBkg: "#eef2ff",
      tertiaryBkg: "#f1f5f9",
    },
  };
}

function MermaidBlock({ chart, lang, theme }: { chart: string; lang: "vi" | "en"; theme: "light" | "dark" }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const m = getMessages(lang).markdown;

  useEffect(() => {
    let ignore = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        const mermaidThemeConfig = getMermaidThemeConfig(theme);
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
          },
          ...mermaidThemeConfig,
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: nextSvg } = await mermaid.render(id, chart);

        if (!ignore) {
          setError("");
          setSvg(nextSvg);
        }
      } catch (renderError) {
        if (!ignore) {
          setSvg("");
          setError(renderError instanceof Error ? renderError.message : "Cannot render mermaid chart");
        }
      }
    }

    renderMermaid();
    return () => {
      ignore = true;
    };
  }, [chart, theme]);

  if (error) {
    return <div className="app-warning rounded-lg p-4 text-sm">{m.cannotRenderMermaid} {error}</div>;
  }

  if (!svg) {
    return <p className="app-text-soft text-sm">{m.renderingDiagram}</p>;
  }

  return <div className="mermaid-diagram app-card overflow-x-auto p-3" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function parseFrontmatter(rawText: string): { frontmatter: FrontmatterData; body: string } {
  const match = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, body: rawText };
  }

  const yamlBlock = match[1];
  const frontmatter: FrontmatterData = {};

  for (const line of yamlBlock.split(/\r?\n/)) {
    const keyValue = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyValue) {
      continue;
    }
    const key = keyValue[1].trim();
    const value = keyValue[2].trim().replace(/^['"]|['"]$/g, "");
    if (key) {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    body: rawText.slice(match[0].length),
  };
}

function useThemeState() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

/* ─── Main Component ─── */

export function ReportMarkdown({ publicPath, lang }: ReportMarkdownProps) {
  const [content, setContent] = useState<string>("");
  const [rawContent, setRawContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>({});
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [copied, setCopied] = useState<boolean>(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const theme = useThemeState();
  const m = getMessages(lang).markdown;

  const markdownComponents: Components = useMemo(
    () => ({
      pre({ children, ...props }) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const child = children as any;
        // Extract language and raw code from the <code> child element
        const codeClassName: string = child?.props?.className ?? "";
        const language = codeClassName.replace("language-", "").toLowerCase();
        const rawCode = child?.props?.children
          ? String(child.props.children).replace(/\n$/, "")
          : "";

        // Mermaid diagrams — render as interactive SVG
        if (language === "mermaid" && rawCode) {
          return <MermaidBlock chart={rawCode} lang={lang} theme={theme} />;
        }

        // Multi-line code blocks — add copy header
        if (rawCode && rawCode.includes("\n")) {
          return <CodeBlockWithCopy language={language} code={rawCode} />;
        }

        // Fallback: standard <pre>
        return <pre {...props}>{children}</pre>;
      },
    }),
    [lang, theme],
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError("");
      try {
        const response = await fetch(publicPath, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Cannot load markdown file: ${response.status}`);
        }
        const text = await response.text();
        const parsed = parseFrontmatter(text);
        if (!ignore) {
          setRawContent(text);
          setFrontmatter(parsed.frontmatter);
          setContent(parsed.body);
          setActiveHeadingId("");
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [publicPath]);

  useEffect(() => {
    const articleElement = articleRef.current;
    if (!articleElement) {
      setTocItems([]);
      return;
    }

    const headings = Array.from(articleElement.querySelectorAll("h1, h2, h3, h4"));
    const slugCount = new Map<string, number>();
    const items: TocItem[] = [];

    for (const heading of headings) {
      const text = heading.textContent?.trim() ?? "";
      if (!text) {
        continue;
      }

      const level = Number(heading.tagName.replace("H", ""));
      const base = slugify(text) || "section";
      const count = slugCount.get(base) ?? 0;
      slugCount.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;

      heading.id = id;
      items.push({ level, text, id });
    }

    setTocItems(items);
  }, [content, viewMode]);

  useEffect(() => {
    if (!tocItems.length) {
      return;
    }

    function scrollToHeadingId(id: string, behavior: ScrollBehavior) {
      const target = document.getElementById(id);
      if (!target) {
        return false;
      }
      const top = target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET_PX;
      window.scrollTo({ top: Math.max(top, 0), behavior });
      return true;
    }

    function resolveHashToId() {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) {
        return null;
      }
      const decoded = safeDecodeHash(raw);
      const candidates = [decoded, raw, slugify(decoded), slugify(raw)].filter(Boolean);
      for (const candidate of candidates) {
        const matched = tocItems.find((item) => item.id === candidate);
        if (matched) {
          return matched.id;
        }
      }
      return null;
    }

    const resolvedFromUrl = resolveHashToId();
    if (resolvedFromUrl) {
      scrollToHeadingId(resolvedFromUrl, "auto");
      setActiveHeadingId(resolvedFromUrl);
    } else {
      setActiveHeadingId(tocItems[0].id);
    }

    function handleHashChange() {
      const nextResolved = resolveHashToId();
      if (!nextResolved) {
        return;
      }
      scrollToHeadingId(nextResolved, "smooth");
      setActiveHeadingId(nextResolved);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [tocItems]);

  useEffect(() => {
    if (!tocItems.length) {
      return;
    }

    const headingElements = tocItems.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!headingElements.length) {
      return;
    }

    let ticking = false;
    const updateActiveHeading = () => {
      const pivot = ANCHOR_OFFSET_PX + 8;
      let current = headingElements[0].id;

      for (const heading of headingElements) {
        const top = heading.getBoundingClientRect().top;
        if (top <= pivot) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveHeadingId(current);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateActiveHeading();
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocItems]);

  function handleTocClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET_PX;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    setActiveHeadingId(id);
  }

  async function handleCopyMarkdown() {
    const targetContent = viewMode === "raw" ? rawContent : content;
    try {
      await navigator.clipboard.writeText(targetContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function renderTocList() {
    return (
      <ul className="space-y-0.5">
        {tocItems.map((item) => (
          <li key={item.id} className={`toc-level-${item.level}`}>
            <a
              href={`#${item.id}`}
              onClick={(event) => handleTocClick(event, item.id)}
              aria-current={activeHeadingId === item.id ? "true" : undefined}
              className={`toc-link block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                activeHeadingId === item.id ? "font-semibold" : "app-text-muted app-hover-muted"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return <p className="app-danger rounded-lg p-4 text-sm">{m.cannotLoadFile} {error}</p>;
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 app-text-soft">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm">{m.loadingContent}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {tocItems.length > 0 ? (
        <aside className="toc-panel app-card hidden p-4 lg:block">
          <p className="app-text-soft mb-3 text-xs font-bold uppercase tracking-wider">{m.tableOfContents}</p>
          <nav>{renderTocList()}</nav>
        </aside>
      ) : null}

      <article ref={articleRef} className="markdown-content app-card p-5 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--ui-border)' }}>
          <p className="app-text-soft text-xs font-semibold uppercase tracking-wider">{m.displayMode}</p>
          <div className="flex items-center gap-2">
            <div className="app-segmented text-xs">
              <button
                type="button"
                onClick={() => setViewMode("rendered")}
                className={`app-segmented-btn ${viewMode === "rendered" ? "app-segmented-btn-active" : ""}`}
              >
                {m.rendered}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`app-segmented-btn ${viewMode === "raw" ? "app-segmented-btn-active" : ""}`}
              >
                {m.raw}
              </button>
            </div>
            <button type="button" onClick={handleCopyMarkdown} className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
              {copied ? <IconCheck /> : <IconClipboard />}
              {copied ? m.copied : viewMode === "raw" ? m.copyRaw : m.copyMarkdown}
            </button>
          </div>
        </div>

        {tocItems.length > 0 ? (
          <details className="app-muted mb-6 rounded-xl border border-(--ui-border) p-4 lg:hidden">
            <summary className="app-text cursor-pointer text-sm font-semibold">{m.openToc}</summary>
            <nav className="mt-3">{renderTocList()}</nav>
          </details>
        ) : null}

        {Object.keys(frontmatter).length > 0 ? (
          <section className="app-muted mb-6 rounded-xl border border-(--ui-border) p-4">
            <p className="app-text-muted mb-2 text-sm font-semibold">{m.metadata}</p>
            <dl className="space-y-1 text-sm">
              {Object.entries(frontmatter).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="app-text-soft font-medium">{key}</dt>
                  <dd className="app-text">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {viewMode === "rendered" ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        ) : (
          <pre className="app-muted app-text-muted overflow-x-auto rounded-xl border border-(--ui-border) p-4 text-sm">
            <code>{rawContent}</code>
          </pre>
        )}
      </article>
    </div>
  );
}
