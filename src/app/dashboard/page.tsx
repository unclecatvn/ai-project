import { cookies, headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { resolveLanguage } from "@/shared/i18n/resolve-language";
import { AppNavbar } from "@/shared/components/app-navbar";
import { getMessages } from "@/shared/i18n/messages";
import { resolveTheme, THEME_COOKIE_KEY } from "@/shared/theme/resolve-theme";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */

type DashboardPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

type DbFile = {
  id: string;
  folder_id: string | null;
  file_type: string | null;
  size: number | null;
  sensitivity_level: string | null;
  updated_at: string;
  created_at: string;
  title: string | null;
  file_name: string | null;
  source_path: string | null;
};

type DbSkill = {
  id: number;
  name: string;
  description: string | null;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  skill_path: string;
  installed_version: string | null;
  latest_version: string | null;
  has_update: boolean;
  installed_at: string;
};

/* ─── Data Aggregation Helpers ─── */

function aggregateByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

function aggregateSizeByKey<T extends { size: number | null }>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    map[key] = (map[key] ?? 0) + (item.size ?? 0);
  }
  return map;
}

/* ─── Page Component ─── */

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const headerStore = await headers();
  const cookieStore = await cookies();
  const lang = resolveLanguage(
    resolvedSearchParams.lang,
    headerStore.get("accept-language"),
    cookieStore.get("NEXT_LOCALE")?.value ?? null,
  );
  const initialTheme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value ?? null);
  const m = getMessages(lang);

  // Fetch all files + skills in parallel (single query each)
  const [filesResult, skillsResult] = await Promise.all([
    supabase
      .from("files")
      .select(
        "id, folder_id, file_type, size, sensitivity_level, updated_at, created_at, title, file_name, source_path",
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase.from("installed_skills").select("*").order("installed_at", { ascending: false }),
  ]);

  const allFiles = (filesResult.data ?? []) as DbFile[];
  const totalFiles = filesResult.count ?? allFiles.length;
  const skills = (skillsResult.data ?? []) as DbSkill[];

  // ─── Aggregate stats from all files (no extra queries) ───
  const totalSize = allFiles.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const recentFiles = allFiles.slice(0, 10);

  // File type distribution
  const fileTypeCounts = aggregateByKey(allFiles, (f) => f.file_type?.toLowerCase() ?? "unknown");
  const fileTypeEntries = Object.entries(fileTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxFileTypeCount = Math.max(...fileTypeEntries.map(([, c]) => c), 1);

  // Folder distribution (top-level from source_path)
  const folderCounts = aggregateByKey(allFiles, (f) => (f.source_path ?? "uncategorized").split("/")[0] || "uncategorized");
  const folderSizes = aggregateSizeByKey(allFiles, (f) => (f.source_path ?? "uncategorized").split("/")[0] || "uncategorized");
  const folderEntries = Object.entries(folderCounts)
    .map(([name, count]) => ({ name, count, size: folderSizes[name] ?? 0 }))
    .sort((a, b) => b.size - a.size);
  const maxFolderSize = Math.max(...folderEntries.map((f) => f.size), 1);

  // Sensitivity breakdown
  const sensitivityCounts = aggregateByKey(allFiles, (f) => f.sensitivity_level ?? "internal");
  const publicCount = sensitivityCounts["public"] ?? 0;
  const internalCount = sensitivityCounts["internal"] ?? 0;
  const restrictedCount = sensitivityCounts["restricted"] ?? 0;

  // Top 10 largest files
  const topLargest = [...allFiles].sort((a, b) => (b.size ?? 0) - (a.size ?? 0)).slice(0, 10);
  const maxSize = topLargest[0]?.size ?? 1;

  // Created this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newThisWeek = allFiles.filter((f) => f.created_at > oneWeekAgo).length;

  // Skills stats
  const skillsWithUpdates = skills.filter((s) => s.has_update).length;

  // Treemap color palette
  const treemapColors = [
    "rgb(34 197 94 / 0.25)", "rgb(59 130 246 / 0.25)", "rgb(139 92 246 / 0.25)",
    "rgb(245 158 11 / 0.25)", "rgb(249 115 22 / 0.25)", "rgb(6 182 212 / 0.25)",
    "rgb(236 72 153 / 0.25)", "rgb(168 85 247 / 0.25)", "rgb(20 184 166 / 0.25)",
    "rgb(234 179 8 / 0.25)",
  ];

  return (
    <main className="vscode-page">
      <AppNavbar lang={lang} initialTheme={initialTheme} />
      <div className="dashboard-layout">
        {/* ─── Sidebar ─── */}
        <aside className="dashboard-sidebar">
          <div className="explorer-sidebar__header">
            <span className="explorer-sidebar__title">DASHBOARD</span>
          </div>

          <nav className="dashboard-nav">
            <SidebarLink
              href={`/?lang=${lang}`}
              label="File Explorer"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>}
            />
            <SidebarLink
              href={`/skills?lang=${lang}`}
              label="Skills Library"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
            />
            <SidebarLink
              href="https://skills.sh"
              label="Browse skills.sh"
              external
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
            />
          </nav>

          {/* Sidebar Overview */}
          <div className="dashboard-sidebar-section">
            <p className="dashboard-sidebar-label">OVERVIEW</p>
            <div className="dashboard-sidebar-stats">
              <SidebarStat label="Total Files" value={String(totalFiles)} color="#22c55e" />
              <SidebarStat label="Total Size" value={formatBytes(totalSize)} color="#3b82f6" />
              <SidebarStat label="New This Week" value={String(newThisWeek)} color="#f59e0b" />
              <SidebarStat label="Skills" value={String(skills.length)} color="#8b5cf6" />
              <SidebarStat label="Folders" value={String(folderEntries.length)} color="#06b6d4" />
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
                  <Link href={`/skills?lang=${lang}`} className="dashboard-sidebar-more">
                    +{skills.length - 6} more...
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>

        {/* ─── Main Content ─── */}
        <div className="dashboard-main">
          {/* Stats Cards Row */}
          <div className="dashboard-stats-grid">
            <StatCard
              label="Total Files"
              value={String(totalFiles)}
              sub={newThisWeek > 0 ? `+${newThisWeek} this week` : "No new files this week"}
              subColor={newThisWeek > 0 ? "#22c55e" : undefined}
              iconBg="rgb(34 197 94 / 0.12)"
              iconColor="#22c55e"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            />
            <StatCard
              label="Total Storage"
              value={formatBytes(totalSize)}
              sub={`Largest: ${formatBytes(maxSize)}`}
              iconBg="rgb(59 130 246 / 0.12)"
              iconColor="#3b82f6"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>}
            />
            <StatCard
              label="Skills Installed"
              value={String(skills.length)}
              sub={skillsWithUpdates > 0 ? `${skillsWithUpdates} update${skillsWithUpdates > 1 ? "s" : ""} available` : "All up to date"}
              subColor={skillsWithUpdates > 0 ? "#f59e0b" : "#22c55e"}
              iconBg="rgb(139 92 246 / 0.12)"
              iconColor="#8b5cf6"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
            />
            <StatCard
              label="Security"
              value={`${publicCount}/${internalCount}/${restrictedCount}`}
              sub="Public · Internal · Restricted"
              iconBg="rgb(239 68 68 / 0.12)"
              iconColor="#ef4444"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            />
          </div>

          {/* Content Grid */}
          <div className="dashboard-content-grid">
            {/* Left Column */}
            <div>
              {/* File Type Distribution */}
              <section className="dashboard-panel" style={{ marginBottom: 16 }}>
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">FILE TYPE DISTRIBUTION</span>
                  <span className="dashboard-panel__badge">{fileTypeEntries.length} types</span>
                </div>
                <div className="dashboard-panel__body">
                  {fileTypeEntries.map(([type, count], i) => {
                    const pct = (count / maxFileTypeCount) * 100;
                    const colors = ["", "dashboard-bar-fill--blue", "dashboard-bar-fill--purple", "dashboard-bar-fill--amber", "dashboard-bar-fill--orange"];
                    return (
                      <div key={type} className="dashboard-bar-row">
                        <span className="dashboard-bar-label" style={{ textTransform: "uppercase" }}>{type}</span>
                        <div className="dashboard-bar-track">
                          <div className={`dashboard-bar-fill ${colors[i] ?? ""}`} style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                        <span className="dashboard-bar-value">{count}</span>
                      </div>
                    );
                  })}
                  {fileTypeEntries.length === 0 ? <p className="dashboard-empty">No file data.</p> : null}
                </div>
              </section>

              {/* Storage by Folder (Treemap) */}
              <section className="dashboard-panel" style={{ marginBottom: 16 }}>
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">STORAGE BY FOLDER</span>
                  <span className="dashboard-panel__badge">{folderEntries.length} folders</span>
                </div>
                <div className="dashboard-panel__body">
                  <div className="dashboard-treemap">
                    {folderEntries.map((folder, i) => {
                      const relSize = folder.size / maxFolderSize;
                      const span = relSize > 0.5 ? 2 : 1;
                      return (
                        <div
                          key={folder.name}
                          className="dashboard-treemap-cell"
                          style={{
                            background: treemapColors[i % treemapColors.length],
                            gridColumn: span > 1 ? "span 2" : undefined,
                          }}
                        >
                          <span className="dashboard-treemap-cell__name">{folder.name}</span>
                          <span className="dashboard-treemap-cell__meta">
                            {folder.count} files · {formatBytes(folder.size)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {folderEntries.length === 0 ? <p className="dashboard-empty">No folders.</p> : null}
                </div>
              </section>

              {/* Top 10 Largest Files */}
              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">TOP 10 LARGEST FILES</span>
                  <span className="dashboard-panel__badge">{formatBytes(totalSize)} total</span>
                </div>
                <div className="dashboard-panel__body">
                  {topLargest.map((file, i) => {
                    const sizePct = maxSize > 0 ? ((file.size ?? 0) / maxSize) * 100 : 0;
                    return (
                      <div key={file.id} className="dashboard-file-row">
                        <span className="dashboard-file-rank">{i + 1}</span>
                        <svg className="dashboard-file-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="dashboard-file-name" title={file.source_path ?? undefined}>
                          {file.file_name ?? file.title ?? `File #${file.id}`}
                        </span>
                        <span className="dashboard-file-size">{formatBytes(file.size ?? 0)}</span>
                        <div className="dashboard-file-bar">
                          <div className="dashboard-file-bar__fill" style={{ width: `${Math.max(sizePct, 3)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {topLargest.length === 0 ? <p className="dashboard-empty">No files.</p> : null}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="dashboard-right-col">
              {/* Recent Activity */}
              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">RECENT ACTIVITY</span>
                  <span className="dashboard-panel__badge">Last 10</span>
                </div>
                <div className="dashboard-panel__body">
                  <div className="dashboard-activity-list">
                    {recentFiles.map((file) => {
                      const title = file.title || file.file_name || file.source_path || `File #${file.id}`;
                      return (
                        <div key={file.id} className="dashboard-activity-item">
                          <div className="dashboard-activity-dot" />
                          <div className="dashboard-activity-content">
                            <p className="dashboard-activity-title">{title}</p>
                            <div className="dashboard-activity-meta">
                              <span className="dashboard-activity-type">{file.file_type ?? "unknown"}</span>
                              <span className="dashboard-activity-time">{formatRelativeTime(file.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {recentFiles.length === 0 ? <p className="dashboard-empty">No activity yet.</p> : null}
                  </div>
                </div>
              </section>

              {/* Sensitivity Breakdown */}
              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <span className="dashboard-panel__title">SENSITIVITY BREAKDOWN</span>
                </div>
                <div className="dashboard-panel__body">
                  {totalFiles > 0 ? (
                    <>
                      <div className="dashboard-sensitivity-stack">
                        {publicCount > 0 ? (
                          <div
                            className="dashboard-sensitivity-stack__seg dashboard-sensitivity-stack__seg--public"
                            style={{ width: `${(publicCount / totalFiles) * 100}%` }}
                            title={`Public: ${publicCount}`}
                          />
                        ) : null}
                        {internalCount > 0 ? (
                          <div
                            className="dashboard-sensitivity-stack__seg dashboard-sensitivity-stack__seg--internal"
                            style={{ width: `${(internalCount / totalFiles) * 100}%` }}
                            title={`Internal: ${internalCount}`}
                          />
                        ) : null}
                        {restrictedCount > 0 ? (
                          <div
                            className="dashboard-sensitivity-stack__seg dashboard-sensitivity-stack__seg--restricted"
                            style={{ width: `${(restrictedCount / totalFiles) * 100}%` }}
                            title={`Restricted: ${restrictedCount}`}
                          />
                        ) : null}
                      </div>
                      <div className="dashboard-sensitivity-legend">
                        <div className="dashboard-sensitivity-legend-item">
                          <div className="dashboard-sensitivity-legend-dot" style={{ background: "#22c55e" }} />
                          <span>Public</span>
                          <span className="dashboard-sensitivity-legend-count">{publicCount}</span>
                        </div>
                        <div className="dashboard-sensitivity-legend-item">
                          <div className="dashboard-sensitivity-legend-dot" style={{ background: "#3b82f6" }} />
                          <span>Internal</span>
                          <span className="dashboard-sensitivity-legend-count">{internalCount}</span>
                        </div>
                        <div className="dashboard-sensitivity-legend-item">
                          <div className="dashboard-sensitivity-legend-dot" style={{ background: "#ef4444" }} />
                          <span>Restricted</span>
                          <span className="dashboard-sensitivity-legend-count">{restrictedCount}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="dashboard-empty">No files to analyze.</p>
                  )}
                </div>
              </section>

              {/* Skills Status Cards */}
              {skills.length > 0 ? (
                <section className="dashboard-panel">
                  <div className="dashboard-panel__header">
                    <span className="dashboard-panel__title">SKILLS STATUS</span>
                    <span className="dashboard-panel__badge">{skills.length} installed</span>
                  </div>
                  <div className="dashboard-panel__body">
                    <div className="dashboard-skill-cards">
                      {skills.map((skill) => (
                        <div key={skill.id} className="dashboard-skill-card">
                          <div className="dashboard-skill-card__top">
                            <span className="dashboard-skill-card__name">{skill.name}</span>
                            <span className={`dashboard-skill-card__version ${skill.has_update ? "dashboard-skill-card__version--update" : ""}`}>
                              {skill.has_update
                                ? `${skill.installed_version ?? "?"} → ${skill.latest_version ?? "?"}`
                                : skill.installed_version ?? "latest"}
                            </span>
                          </div>
                          {skill.description ? (
                            <p className="dashboard-skill-card__desc">{skill.description}</p>
                          ) : null}
                          <a
                            href={skill.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dashboard-skill-card__repo"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77a5.07 5.07 0 0 0-.09-3.77S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                            {skill.repo_owner}/{skill.repo_name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          {/* Full-Width: Folder Distribution */}
          <div className="dashboard-full-width">
            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <span className="dashboard-panel__title">FOLDER DISTRIBUTION</span>
                <span className="dashboard-panel__badge">{totalFiles} files in {folderEntries.length} folders</span>
              </div>
              <div className="dashboard-panel__body">
                {folderEntries.map((folder) => {
                  const pct = totalFiles > 0 ? (folder.count / totalFiles) * 100 : 0;
                  return (
                    <div key={folder.name} className="dashboard-bar-row">
                      <span className="dashboard-bar-label">{folder.name}</span>
                      <div className="dashboard-bar-track">
                        <div className="dashboard-bar-fill dashboard-bar-fill--blue" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="dashboard-bar-value">{folder.count} files</span>
                      <span className="dashboard-bar-value">{formatBytes(folder.size)}</span>
                    </div>
                  );
                })}
                {folderEntries.length === 0 ? <p className="dashboard-empty">No folders loaded.</p> : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-Components ─── */

function StatCard({
  label, value, sub, subColor, icon, iconBg, iconColor,
}: {
  label: string; value: string; sub?: string; subColor?: string;
  icon: ReactNode; iconBg: string; iconColor: string;
}) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-card__top">
        <span className="dashboard-stat-card__label">{label}</span>
        <div className="dashboard-stat-card__icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <p className="dashboard-stat-card__value">{value}</p>
      {sub ? <p className="dashboard-stat-card__sub" style={{ color: subColor ?? "var(--ui-text-soft)" }}>{sub}</p> : null}
    </div>
  );
}

function SidebarLink({ href, label, icon, external = false }: {
  href: string; label: string; icon: ReactNode; external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="dashboard-nav-link">
        {icon}
        <span>{label}</span>
        <svg className="dashboard-nav-external" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
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
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatRelativeTime(isoDate: string): string {
  try {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return isoDate;
  }
}
