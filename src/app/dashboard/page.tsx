import { cookies, headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { AppNavbar } from "@/shared/components/app-navbar";
import { getMessages } from "@/shared/i18n/messages";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";
import { supabase } from "@/lib/supabase";

type DashboardPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

type DashboardFile = {
  id: string;
  folder_id: string | null;
  file_type: string | null;
  size: number | null;
  updated_at: string;
  title: string | null;
  file_name: string | null;
  source_path: string | null;
};

type DashboardCategory = {
  id: string;
  label: string;
  count: number;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(resolvedSearchParams.lang, headerStore.get("accept-language"), cookieStore.get("NEXT_LOCALE")?.value ?? null);
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);

  const [filesResult, skillsResult] = await Promise.all([
    supabase
      .from("files")
      .select("id, folder_id, file_type, size, updated_at, title, file_name, source_path", { count: "exact" })
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase.from("installed_skills").select("*").order("installed_at", { ascending: false }),
  ]);

  const totalFiles = filesResult.count ?? 0;
  const recentFiles = (filesResult.data ?? []) as DashboardFile[];
  const categoriesMap = recentFiles.reduce<Record<string, number>>((acc, file) => {
    const root = (file.source_path ?? "uncategorized").split("/")[0] || "uncategorized";
    acc[root] = (acc[root] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(categoriesMap).map(([key, count]) => ({
    id: key,
    label: key,
    count,
  })) as DashboardCategory[];
  const skills = skillsResult.data ?? [];
  const recentTotalSize = recentFiles.reduce((sum, file) => sum + (file.size ?? 0), 0);
  const skillsWithUpdates = skills.filter((s) => s.has_update).length;
  const categoryEntries = categories.map((category) => {
    const count = category.count;
    const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
    return { ...category, count, percentage };
  });
  const categoriesWithFiles = categoryEntries.filter((category) => category.count > 0).length;
  const topCategory = [...categoryEntries].sort((a, b) => b.count - a.count)[0] ?? null;
  const latestFileUpdate = recentFiles[0]?.updated_at ?? null;
  const fileTypeMap = recentFiles.reduce<Record<string, number>>((acc, file) => {
    const key = file.file_type?.toLowerCase() ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const fileTypeEntries = Object.entries(fileTypeMap).sort((a, b) => b[1] - a[1]);

  return (
    <main className="vscode-page">
      <AppNavbar lang={lang} initialTheme={initialTheme} />
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="explorer-sidebar__header">
            <span className="explorer-sidebar__title">DASHBOARD</span>
          </div>

          {/* Quick Nav */}
          <nav className="dashboard-nav">
            <SidebarLink href={`/?lang=${lang}`} label="File Explorer" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>} />
            <SidebarLink href={`/skills?lang=${lang}`} label="Skills Library" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>} />
            <SidebarLink href="https://skills.sh" label="Browse skills.sh" external icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>} />
          </nav>

          {/* Stats Summary */}
          <div className="dashboard-sidebar-section">
            <p className="dashboard-sidebar-label">OVERVIEW</p>
            <div className="dashboard-sidebar-stats">
              <SidebarStat label="Total Files" value={String(totalFiles)} color="#3b82f6" />
              <SidebarStat label="Categories" value={`${categoriesWithFiles}/${categories.length}`} color="#8b5cf6" />
              <SidebarStat label="Skills" value={String(skills.length)} color="#22c55e" />
              <SidebarStat label="Data Size" value={formatBytes(recentTotalSize)} color="#f59e0b" />
            </div>
          </div>

          {/* Skills Health */}
          {skills.length > 0 ? (
            <div className="dashboard-sidebar-section">
              <p className="dashboard-sidebar-label">SKILLS HEALTH</p>
              <div className="dashboard-skills-list">
                {skills.slice(0, 6).map((skill) => (
                  <div key={skill.id} className="dashboard-skill-item">
                    <span className="dashboard-skill-name">{skill.name}</span>
                    {skill.has_update ? (
                      <span className="dashboard-skill-badge dashboard-skill-badge--update">update</span>
                    ) : (
                      <span className="dashboard-skill-badge">latest</span>
                    )}
                  </div>
                ))}
                {skills.length > 6 ? (
                  <Link href={`/skills?lang=${lang}`} className="dashboard-sidebar-more">+{skills.length - 6} more...</Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Stat Cards */}
          <div className="dashboard-stats-grid">
            <StatCard
              label="Total Files"
              value={String(totalFiles)}
              subtext={topCategory ? `Top: ${topCategory.label}` : undefined}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
              gradient="linear-gradient(135deg, rgb(59 130 246 / 0.12), rgb(99 102 241 / 0.12))"
              iconColor="#3b82f6"
            />
            <StatCard
              label="Category Coverage"
              value={`${categoriesWithFiles}/${categories.length}`}
              subtext={categories.length > 0 ? `${Math.round((categoriesWithFiles / categories.length) * 100)}% active` : undefined}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>}
              gradient="linear-gradient(135deg, rgb(139 92 246 / 0.12), rgb(168 85 247 / 0.12))"
              iconColor="#8b5cf6"
            />
            <StatCard
              label="Skills Installed"
              value={String(skills.length)}
              subtext={skillsWithUpdates > 0 ? `${skillsWithUpdates} update${skillsWithUpdates > 1 ? "s" : ""} available` : undefined}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
              gradient="linear-gradient(135deg, rgb(34 197 94 / 0.12), rgb(16 185 129 / 0.12))"
              iconColor="#22c55e"
            />
            <StatCard
              label="Recent Data Size"
              value={formatBytes(recentTotalSize)}
              subtext={latestFileUpdate ? `Updated: ${formatDateTime(latestFileUpdate, lang)}` : undefined}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>}
              gradient="linear-gradient(135deg, rgb(245 158 11 / 0.12), rgb(249 115 22 / 0.12))"
              iconColor="#f59e0b"
            />
          </div>

          {/* Content Grid */}
          <div className="dashboard-content-grid">
            {/* Category Breakdown */}
            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">CATEGORY BREAKDOWN</span>
              </div>
              <div className="dashboard-panel__body">
                {categoryEntries.map((category) => (
                  <div key={category.id} className="dashboard-category-row">
                    <div className="dashboard-category-info">
                      <span className="dashboard-category-name">{category.label}</span>
                      <span className="dashboard-category-count">{category.count} files</span>
                    </div>
                    <div className="dashboard-progress">
                      <div className="dashboard-progress__fill" style={{ width: `${Math.max(category.percentage, 4)}%` }} />
                    </div>
                    <span className="dashboard-category-pct">{category.percentage.toFixed(1)}%</span>
                  </div>
                ))}
                {categories.length === 0 ? (
                  <p className="dashboard-empty">No categories loaded.</p>
                ) : null}
              </div>
            </section>

            {/* Right Column */}
            <div className="dashboard-right-col">
              {/* Recent Activity */}
              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">RECENT ACTIVITY</span>
                </div>
                <div className="dashboard-panel__body">
                  {recentFiles.slice(0, 6).map((file) => {
                    const title = file.title || file.file_name || file.source_path || `File #${file.id}`;
                    return (
                      <div key={file.id} className="dashboard-activity-item">
                        <div className="dashboard-activity-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                        <div className="dashboard-activity-content">
                          <p className="dashboard-activity-title">{title}</p>
                          <div className="dashboard-activity-meta">
                            <span className="app-badge text-[0.6rem]">{file.file_type ?? "unknown"}</span>
                            <span className="dashboard-activity-time">{formatDateTime(file.updated_at, lang)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {recentFiles.length === 0 ? (
                    <p className="dashboard-empty">No activity yet.</p>
                  ) : null}
                </div>
              </section>

              {/* File Types */}
              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">FILE TYPE MIX</span>
                </div>
                <div className="dashboard-panel__body">
                  {fileTypeEntries.map(([type, count]) => {
                    const percentage = recentFiles.length > 0 ? (count / recentFiles.length) * 100 : 0;
                    return (
                      <div key={type} className="dashboard-category-row">
                        <div className="dashboard-category-info">
                          <span className="dashboard-category-name" style={{ textTransform: "uppercase" }}>{type}</span>
                          <span className="dashboard-category-count">{count}</span>
                        </div>
                        <div className="dashboard-progress">
                          <div className="dashboard-progress__fill dashboard-progress__fill--accent" style={{ width: `${Math.max(percentage, 6)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {fileTypeEntries.length === 0 ? <p className="dashboard-empty">No file type data.</p> : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-Components ─── */

function StatCard({ label, value, subtext, icon, gradient, iconColor }: {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div className="app-stat-card" style={{ background: gradient }}>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="app-text-soft text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="app-text text-2xl font-bold mt-1">{value}</p>
          {subtext ? <p className="text-xs mt-0.5" style={{ color: iconColor }}>{subtext}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${iconColor}22`, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, label, icon, external = false }: { href: string; label: string; icon: ReactNode; external?: boolean }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="dashboard-nav-link">
        {icon}
        <span>{label}</span>
        <svg className="dashboard-nav-external" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
      </a>
    );
  }
  return (
    <Link href={href} className="dashboard-nav-link">
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SidebarStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="dashboard-sidebar-stat">
      <div className="dashboard-sidebar-stat-dot" style={{ background: color }} />
      <span className="dashboard-sidebar-stat-label">{label}</span>
      <span className="dashboard-sidebar-stat-value">{value}</span>
    </div>
  );
}

/* ─── Helpers ─── */

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDateTime(input: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(input));
  } catch {
    return input;
  }
}
