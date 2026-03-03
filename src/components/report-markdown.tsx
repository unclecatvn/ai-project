"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type ReportMarkdownProps = {
  publicPath: string;
};

type FrontmatterData = Record<string, string>;

type TocItem = {
  level: number;
  text: string;
  id: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "neutral",
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
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Không render được sơ đồ Mermaid. {error}
      </div>
    );
  }

  if (!svg) {
    return <p className="text-sm text-slate-500">Đang render sequence diagram...</p>;
  }

  return (
    <div
      className="mermaid-diagram overflow-x-auto rounded-lg border border-slate-200 bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
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

export function ReportMarkdown({ publicPath }: ReportMarkdownProps) {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>({});
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const articleRef = useRef<HTMLElement | null>(null);

  const markdownComponents: Components = {
    code({ className, children, ...props }) {
      const language = className?.replace("language-", "").toLowerCase() ?? "";
      const rawCode = String(children).replace(/\n$/, "");

      if (language === "mermaid") {
        return <MermaidBlock chart={rawCode} />;
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError("");
      try {
        const response = await fetch(publicPath);
        if (!response.ok) {
          throw new Error(`Cannot load markdown file: ${response.status}`);
        }
        const text = await response.text();
        const parsed = parseFrontmatter(text);
        if (!ignore) {
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
  }, [content]);

  useEffect(() => {
    if (!tocItems.length || !window.location.hash) {
      return;
    }
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
    }
  }, [tocItems]);

  useEffect(() => {
    if (!tocItems.length) {
      return;
    }

    const headingElements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveHeadingId((visible[0].target as HTMLElement).id);
        }
      },
      {
        rootMargin: "0px 0px -70% 0px",
        threshold: [0.1, 0.5, 1],
      },
    );

    for (const element of headingElements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [tocItems]);

  function handleTocClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveHeadingId(id);
  }

  function renderTocList() {
    return (
      <ul className="space-y-1.5">
        {tocItems.map((item) => (
          <li key={item.id} className={`toc-level-${item.level}`}>
            <a
              href={`#${item.id}`}
              onClick={(event) => handleTocClick(event, item.id)}
              aria-current={activeHeadingId === item.id ? "true" : undefined}
              className={`toc-link block rounded-md px-2 py-1.5 text-sm transition ${
                activeHeadingId === item.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        Không thể tải nội dung file. {error}
      </p>
    );
  }

  if (!content) {
    return <p className="text-sm text-slate-500">Đang tải nội dung...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {tocItems.length > 0 ? (
        <aside className="toc-panel hidden rounded-2xl bg-white p-4 shadow-sm lg:block">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Mục lục</p>
          <nav>{renderTocList()}</nav>
        </aside>
      ) : null}

      <article ref={articleRef} className="markdown-content rounded-2xl bg-white p-5 shadow-sm md:p-8">
        {tocItems.length > 0 ? (
          <details className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Mở mục lục</summary>
            <nav className="mt-3">{renderTocList()}</nav>
          </details>
        ) : null}
        {Object.keys(frontmatter).length > 0 ? (
          <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Thông tin tài liệu</p>
            <dl className="space-y-1 text-sm text-slate-700">
              {Object.entries(frontmatter).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="font-medium text-slate-600">{key}</dt>
                  <dd className="text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
