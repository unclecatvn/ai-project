"use client";

import { useEffect, useState, useCallback } from "react";
import type { InstalledSkill } from "@/lib/supabase";

/* ─── SVG Icons (Lucide-style) ─── */
function IconZap() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconRefresh() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}
function IconGithub() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>;
}
function IconExternalLink() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}
function IconArrowUp() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>;
}
function IconFolder() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
}
function IconGitBranch() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconDownload() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}
function IconSpinner() {
  return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconList() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
}

type RepoContentItem = {
  name: string;
  type: "file" | "dir";
  path: string;
};

type RepoContentsResponse = {
  owner: string;
  repo: string;
  default_branch: string;
  has_root_skill: boolean;
  root_dirs: string[];
  contents: {
    skills: RepoContentItem[];
    rules: RepoContentItem[];
    agents: RepoContentItem[];
    commands: RepoContentItem[];
  };
};

type SkillFileItem = {
  id: string;
  title: string;
  file_name: string;
  source_path: string;
  file_type: string;
  updated_at: string;
};

function parseNpxSkillsCommand(input: string): { repoUrl: string; skillName: string | null } | null {
  const normalized = input.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^npx\s+skills\s+add\s+(.+)$/i);
  if (!match) return null;
  const rest = match[1];
  const skillMatch = rest.match(/\s--skill\s+([^\s]+)/i);
  const repoUrl = rest.replace(/\s--skill\s+[^\s]+/i, "").trim();
  const skillName = skillMatch?.[1]?.trim() ?? null;
  if (!repoUrl) return null;
  return { repoUrl, skillName };
}

/* ─── Skill Detail Card ─── */
function SkillCard({
  skill,
  updatingId,
  viewingFilesId,
  onUpdate,
  onViewFiles,
  onDelete,
}: {
  skill: InstalledSkill;
  updatingId: number | null;
  viewingFilesId: number | null;
  onUpdate: (id: number) => void;
  onViewFiles: (skill: InstalledSkill) => void;
  onDelete: (id: number) => void;
}) {
  const repoShort = `${skill.repo_owner}/${skill.repo_name}`;
  const skillFolder = skill.skill_path !== skill.repo_name ? skill.skill_path : null;

  return (
    <div
      className="app-card group relative flex flex-col gap-3 p-4 cursor-pointer"
      style={{ transition: "box-shadow 200ms ease, border-color 200ms ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ui-accent-green)";
        e.currentTarget.style.boxShadow = "0 0 0 1px rgb(34 197 94 / 0.15), 0 4px 12px rgb(0 0 0 / 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ui-border)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgb(0 0 0 / 0.04), 0 1px 2px rgb(0 0 0 / 0.02)";
      }}
    >
      {/* Top: Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="app-text font-bold text-sm truncate" title={skill.name}>
            {skill.name}
          </h3>
        </div>
        {skill.has_update ? (
          <span className="app-badge-green app-badge flex-shrink-0">
            <IconArrowUp /> Update
          </span>
        ) : (
          <span className="app-badge flex-shrink-0" style={{ fontSize: "0.65rem" }}>latest</span>
        )}
      </div>

      {/* Description */}
      {skill.description ? (
        <p className="app-text-muted text-xs leading-relaxed line-clamp-2">{skill.description}</p>
      ) : null}

      {/* Metadata: Repo + Path + Branch */}
      <div className="flex flex-col gap-1.5 mt-auto">
        {/* Repo source */}
        <div className="flex items-center gap-1.5 text-xs app-text-soft">
          <IconGithub />
          <a
            href={`https://github.com/${repoShort}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate"
            style={{ color: "var(--ui-text-soft)" }}
            title={repoShort}
          >
            {repoShort}
          </a>
        </div>

        {/* Skill path within repo */}
        {skillFolder ? (
          <div className="flex items-center gap-1.5 text-xs app-text-muted">
            <IconFolder />
            <span className="font-mono truncate" title={skillFolder}>{skillFolder}</span>
          </div>
        ) : null}

        {/* Branch + Version */}
        <div className="flex items-center gap-3 text-xs app-text-muted">
          {skill.default_branch ? (
            <span className="flex items-center gap-1">
              <IconGitBranch />
              <span className="font-mono">{skill.default_branch}</span>
            </span>
          ) : null}
          {skill.installed_version ? (
            <span className="font-mono" title={`Commit: ${skill.installed_version}`}>
              {skill.installed_version.slice(0, 7)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Divider + Actions */}
      <div
        className="flex items-center justify-end gap-1.5 pt-2 border-t"
        style={{ borderColor: "var(--ui-border)" }}
      >
        {skill.has_update ? (
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(skill.id); }}
            disabled={updatingId === skill.id}
            className="app-button-primary px-2.5 py-1 text-xs inline-flex items-center gap-1 cursor-pointer"
          >
            {updatingId === skill.id ? <IconSpinner /> : <><IconRefresh /> Update</>}
          </button>
        ) : null}
        <a
          href={`https://github.com/${repoShort}${skillFolder ? `/tree/${skill.default_branch || "main"}/${skillFolder}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="app-button-ghost px-2 py-1 text-xs inline-flex items-center cursor-pointer"
          title="View on GitHub"
        >
          <IconExternalLink />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onViewFiles(skill); }}
          disabled={viewingFilesId === skill.id}
          className="app-button-ghost px-2 py-1 text-xs inline-flex items-center gap-1 cursor-pointer"
          title="View related files"
        >
          {viewingFilesId === skill.id ? <IconSpinner /> : <IconList />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(skill.id); }}
          className="app-button-ghost px-2 py-1 text-xs inline-flex items-center cursor-pointer"
          style={{ color: "var(--ui-danger-fg)" }}
          title="Uninstall"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}

/* ─── Repo Preview Section ─── */
function RepoPreviewPanel({
  preview,
  loading,
  error,
}: {
  preview: RepoContentsResponse | null;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border p-4 flex items-center gap-2 app-text-soft text-xs" style={{ borderColor: "var(--ui-border)" }}>
        <IconSpinner /> Loading repository contents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--ui-danger-border)", color: "var(--ui-danger-fg)", background: "var(--ui-danger-bg)" }}>
        {error}
      </div>
    );
  }

  if (!preview) return null;

  const sections: { label: string; icon: React.ReactNode; items: RepoContentItem[]; color: string }[] = [
    { label: "Skills", icon: <IconZap />, items: preview.contents.skills, color: "rgb(34 197 94)" },
    { label: "Subagents", icon: <IconSearch />, items: preview.contents.agents, color: "rgb(139 92 246)" },
    { label: "Rules", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, items: preview.contents.rules, color: "rgb(59 130 246)" },
    { label: "Commands", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>, items: preview.contents.commands, color: "rgb(245 158 11)" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ui-border)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--ui-bg-muted)" }}>
        <div className="flex items-center gap-2">
          <IconGithub />
          <span className="app-text text-sm font-semibold">{preview.owner}/{preview.repo}</span>
        </div>
        <span className="flex items-center gap-1 text-xs app-text-muted font-mono">
          <IconGitBranch /> {preview.default_branch}
        </span>
      </div>

      {/* Content sections */}
      <div className="p-4 space-y-3">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ color: section.color }}>{section.icon}</span>
              <span className="text-xs font-semibold app-text" style={{ color: section.color }}>
                {section.label}
              </span>
              <span className="text-xs app-text-muted">({section.items.length})</span>
            </div>
            {section.items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 ml-5">
                {section.items.map((item) => (
                  <span
                    key={item.path}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono cursor-pointer"
                    style={{
                      background: "var(--ui-bg-muted)",
                      color: "var(--ui-text)",
                      border: "1px solid var(--ui-border)",
                      transition: "border-color 200ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = section.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--ui-border)"; }}
                    title={item.path}
                  >
                    {item.type === "dir" ? <IconFolder /> : null}
                    {item.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="ml-5 text-xs app-text-muted italic">None found</p>
            )}
          </div>
        ))}

        {preview.has_root_skill ? (
          <div className="ml-5 text-xs app-text-soft flex items-center gap-1.5">
            <IconZap />
            <span>Root-level SKILL.md detected</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function SkillsManager() {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [skillName, setSkillName] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [installing, setInstalling] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [batchResult, setBatchResult] = useState("");
  const [syncResult, setSyncResult] = useState("");
  const [importToExplorer, setImportToExplorer] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [repoPreviewLoading, setRepoPreviewLoading] = useState(false);
  const [repoPreviewError, setRepoPreviewError] = useState("");
  const [repoPreview, setRepoPreview] = useState<RepoContentsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingFilesId, setViewingFilesId] = useState<number | null>(null);
  const [filesModalSkill, setFilesModalSkill] = useState<InstalledSkill | null>(null);
  const [filesModalData, setFilesModalData] = useState<SkillFileItem[]>([]);
  const [filesModalError, setFilesModalError] = useState("");

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      const json = await res.json();
      setSkills(json.data ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const res = await fetch("/api/skills");
        const json = await res.json();
        if (active) setSkills(json.data ?? []);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    }
    void initialLoad();
    return () => { active = false; };
  }, []);

  function getRepoInputForPreview(input: string) {
    const parsed = parseNpxSkillsCommand(input);
    return (parsed?.repoUrl ?? input).trim();
  }

  async function handleInstall() {
    if (!repoUrl.trim()) return;
    setInstalling(true);
    setError("");
    setBatchResult("");
    setSyncResult("");
    try {
      const payload: Record<string, string> = { repo_url: repoUrl.trim() };
      if (skillName.trim()) payload.skill_name = skillName.trim();
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Install failed");
      } else {
        if (importToExplorer) await syncRepoToExplorer(repoUrl.trim());
        setRepoUrl("");
        setSkillName("");
        setShowModal(false);
        fetchSkills();
      }
    } catch {
      setError("Network error");
    }
    setInstalling(false);
  }

  async function handleBatchInstall() {
    const lines = batchInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setInstalling(true);
    setError("");
    setBatchResult("");
    setSyncResult("");
    let successCount = 0;
    let failedCount = 0;
    const failures: string[] = [];
    for (const line of lines) {
      try {
        const res = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_url: line }),
        });
        const json = await res.json();
        if (!res.ok) {
          failedCount += 1;
          failures.push(`${line} → ${json.error ?? "Install failed"}`);
          continue;
        }
        successCount += 1;
        if (importToExplorer) await syncRepoToExplorer(line);
      } catch {
        failedCount += 1;
        failures.push(`${line} → Network error`);
      }
    }
    setBatchResult(`Installed ${successCount}/${lines.length} skill(s)${failedCount > 0 ? `, failed ${failedCount}` : ""}.`);
    if (failures.length > 0) setError(failures.slice(0, 3).join(" | "));
    if (successCount > 0) { setBatchInput(""); fetchSkills(); }
    setInstalling(false);
  }

  async function syncRepoToExplorer(repoInput: string) {
    setSyncingRepo(true);
    try {
      const res = await fetch("/api/files/sync-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoInput, categories: ["skills"] }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Sync to Explorer failed"); return false; }
      setSyncResult(`Imported ${json.imported ?? 0} file(s) to Explorer.`);
      return true;
    } catch {
      setError("Sync to Explorer failed");
      return false;
    } finally {
      setSyncingRepo(false);
    }
  }

  async function handleSyncRepoOnly() {
    if (!repoUrl.trim()) return;
    setError("");
    setSyncResult("");
    await syncRepoToExplorer(repoUrl.trim());
  }

  useEffect(() => {
    const targetRepo = getRepoInputForPreview(repoUrl);
    if (!showModal || !targetRepo) {
      setRepoPreview(null);
      setRepoPreviewError("");
      setRepoPreviewLoading(false);
      return;
    }
    let active = true;
    setRepoPreviewLoading(true);
    setRepoPreviewError("");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/skills/repo-contents?repo=${encodeURIComponent(targetRepo)}`);
        const json = await res.json();
        if (!active) return;
        if (!res.ok) {
          setRepoPreview(null);
          setRepoPreviewError(json.error ?? "Cannot read repository contents");
          return;
        }
        setRepoPreview(json as RepoContentsResponse);
      } catch {
        if (!active) return;
        setRepoPreview(null);
        setRepoPreviewError("Cannot read repository contents");
      } finally {
        if (active) setRepoPreviewLoading(false);
      }
    }, 400);
    return () => { active = false; clearTimeout(timer); };
  }, [repoUrl, showModal]);

  async function handleCheckUpdates() {
    setChecking(true);
    try {
      await fetch("/api/skills/check-updates", { method: "POST" });
      fetchSkills();
    } catch { /* ignore */ }
    setChecking(false);
  }

  async function handleUpdate(id: number) {
    setUpdatingId(id);
    try {
      await fetch(`/api/skills/${id}`, { method: "PATCH" });
      fetchSkills();
    } catch { /* ignore */ }
    setUpdatingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Uninstall this skill?")) return;
    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      fetchSkills();
      if (json && typeof json.deleted_files === "number") {
        setSyncResult(`Uninstalled skill and removed ${json.deleted_files} related file(s) from Explorer.`);
      }
    } catch { /* ignore */ }
  }

  async function handleViewFiles(skill: InstalledSkill) {
    setViewingFilesId(skill.id);
    setFilesModalSkill(skill);
    setFilesModalError("");
    setFilesModalData([]);
    try {
      const res = await fetch(`/api/skills/${skill.id}/files`);
      const json = await res.json();
      if (!res.ok) {
        setFilesModalError(json.error ?? "Cannot load files for this skill");
        return;
      }
      setFilesModalData(Array.isArray(json.data) ? json.data : []);
    } catch {
      setFilesModalError("Cannot load files for this skill");
    } finally {
      setViewingFilesId(null);
    }
  }

  // Group skills by repo
  const groupedSkills = skills.reduce<Record<string, InstalledSkill[]>>((acc, skill) => {
    const key = `${skill.repo_owner}/${skill.repo_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {});

  // Filter by search
  const filteredSkills = searchTerm.trim()
    ? skills.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.repo_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.skill_path.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : skills;

  const repos = Object.keys(groupedSkills);
  const totalUpdates = skills.filter((s) => s.has_update).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, rgb(34 197 94 / 0.15), rgb(59 130 246 / 0.15))" }}
          >
            <IconZap />
          </div>
          <div>
            <h2 className="app-text text-lg font-bold">Skills Library</h2>
            <p className="app-text-soft text-xs">
              {skills.length} skill{skills.length !== 1 ? "s" : ""} from {repos.length} repo{repos.length !== 1 ? "s" : ""}
              {totalUpdates > 0 ? (
                <span style={{ color: "var(--ui-accent-green)" }}> • {totalUpdates} update{totalUpdates !== 1 ? "s" : ""}</span>
              ) : null}
              {" • "}
              <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline cursor-pointer" style={{ color: "var(--ui-accent-green)" }}>
                Browse skills.sh <IconExternalLink />
              </a>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCheckUpdates}
            disabled={checking}
            className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer"
          >
            {checking ? <IconSpinner /> : <IconRefresh />} {checking ? "Checking…" : "Check Updates"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="app-button-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium cursor-pointer"
          >
            <IconPlus /> Add Skill
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {skills.length > 0 ? (
        <div className="mb-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 app-text-muted">
            <IconSearch />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills by name, description, or repo..."
            className="app-input w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
      ) : null}

      {/* Skills Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 app-text-soft">
            <IconSpinner />
            <span className="text-sm">Loading skills…</span>
          </div>
        </div>
      ) : filteredSkills.length === 0 && skills.length > 0 ? (
        <div className="app-card p-8 text-center">
          <div className="app-text-muted mb-2"><IconSearch /></div>
          <p className="app-text font-semibold">No skills match &quot;{searchTerm}&quot;</p>
          <p className="app-text-soft mt-1 text-sm">Try different keywords or clear the search</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="app-card p-8 text-center">
          <div className="flex justify-center mb-3 app-text-muted"><IconDownload /></div>
          <p className="app-text font-semibold">No skills installed yet</p>
          <p className="app-text-soft mt-1 text-sm">
            Click &quot;Add Skill&quot; to install from a Git repository or browse{" "}
            <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" className="underline cursor-pointer" style={{ color: "var(--ui-accent-green)" }}>skills.sh</a>
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              updatingId={updatingId}
              viewingFilesId={viewingFilesId}
              onUpdate={handleUpdate}
              onViewFiles={handleViewFiles}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Install Modal */}
      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgb(0 0 0 / 0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="app-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="app-text text-lg font-bold mb-1">Add Skill from Git Repository</h3>
            <p className="app-text-soft text-sm mb-5">
              Install from{" "}
              <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" className="underline cursor-pointer" style={{ color: "var(--ui-accent-green)" }}>skills.sh</a> or any GitHub repo containing a SKILL.md file.
            </p>

            <div className="space-y-4">
              {/* Repo URL */}
              <div>
                <label className="app-text-soft text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Repo URL or Full Command
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="npx skills add https://github.com/owner/repo --skill odoo-18"
                  className="app-input w-full px-3 py-2.5 text-sm"
                />
                <p className="app-text-soft text-[0.65rem] mt-1">
                  Hỗ trợ: <code className="app-text-muted">owner/repo</code>,{" "}
                  <code className="app-text-muted">https://github.com/owner/repo</code>, hoặc{" "}
                  <code className="app-text-muted">npx skills add ... --skill ...</code>
                </p>
              </div>

              {/* Skill Name */}
              <div>
                <label className="app-text-soft text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Skill Name <span className="app-text-soft font-normal normal-case">(optional — folder name within repo)</span>
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. odoo-18"
                  className="app-input w-full px-3 py-2.5 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleInstall()}
                />
                <p className="app-text-soft text-[0.65rem] mt-1">
                  Leave empty if SKILL.md is at repo root. Use folder name for multi-skill repos.
                </p>
              </div>

              {/* CLI equivalent */}
              {repoUrl.trim() ? (
                <div className="rounded-lg px-3 py-2" style={{ background: "var(--ui-bg-muted)" }}>
                  <p className="app-text-soft text-[0.65rem] font-mono">
                    <span className="app-text-muted">$</span>{" "}
                    {repoUrl.trim().startsWith("npx skills add")
                      ? repoUrl.trim()
                      : `npx skills add ${repoUrl.trim()}${skillName.trim() ? ` --skill ${skillName.trim()}` : ""}`}
                  </p>
                </div>
              ) : null}

              {/* Repo Preview */}
              {repoUrl.trim() ? (
                <RepoPreviewPanel
                  preview={repoPreview}
                  loading={repoPreviewLoading}
                  error={repoPreviewError}
                />
              ) : null}

              {/* Batch Install */}
              <div>
                <label className="app-text-soft text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Batch Install (one command/repo each line)
                </label>
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder={"npx skills add https://github.com/unclecatvn/agent-skills --skill odoo-18\nnpx skills add vercel-labs/skills --skill find-skills"}
                  className="app-input w-full px-3 py-2.5 text-sm font-mono"
                  rows={3}
                />
              </div>

              <label className="flex items-center gap-2 text-sm app-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={importToExplorer}
                  onChange={(event) => setImportToExplorer(event.target.checked)}
                />
                Also import repo skills to Explorer
              </label>
            </div>

            {/* Feedback */}
            {error ? <p className="text-sm mt-3" style={{ color: "var(--ui-danger-fg)" }}>{error}</p> : null}
            {batchResult ? <p className="app-text-soft text-xs mt-2">{batchResult}</p> : null}
            {syncResult ? <p className="app-text-soft text-xs mt-2">{syncResult}</p> : null}

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowModal(false); setError(""); setBatchResult(""); setSyncResult(""); }}
                className="app-button-secondary px-4 py-2 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSyncRepoOnly}
                disabled={syncingRepo || !repoUrl.trim()}
                className="app-button-secondary px-4 py-2 text-sm font-medium cursor-pointer"
              >
                {syncingRepo ? "Importing..." : "Import to Explorer"}
              </button>
              <button
                onClick={handleBatchInstall}
                disabled={installing || !batchInput.trim()}
                className="app-button-secondary px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                {installing ? "Installing…" : "Install Batch"}
              </button>
              <button
                onClick={handleInstall}
                disabled={installing || !repoUrl.trim()}
                className="app-button-primary px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                {installing ? (
                  <><IconSpinner /> Installing…</>
                ) : (
                  <><IconPlus /> Install Skill</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Files Modal */}
      {filesModalSkill ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgb(0 0 0 / 0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="app-card w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="app-text text-lg font-bold">Files for {filesModalSkill.name}</h3>
                <p className="app-text-soft text-sm">
                  {filesModalData.length} file{filesModalData.length !== 1 ? "s" : ""} linked to this skill
                </p>
              </div>
              <button
                onClick={() => {
                  setFilesModalSkill(null);
                  setFilesModalData([]);
                  setFilesModalError("");
                }}
                className="app-button-secondary px-3 py-1.5 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

            {filesModalError ? (
              <p className="text-sm" style={{ color: "var(--ui-danger-fg)" }}>{filesModalError}</p>
            ) : null}

            {!filesModalError && filesModalData.length === 0 ? (
              <div className="rounded-lg border p-5 text-sm app-text-soft" style={{ borderColor: "var(--ui-border)" }}>
                No imported files found for this skill.
              </div>
            ) : null}

            {filesModalData.length > 0 ? (
              <div className="space-y-2">
                {filesModalData.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-lg border px-3 py-2.5"
                    style={{ borderColor: "var(--ui-border)", background: "var(--ui-bg-muted)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="app-text text-sm font-medium truncate">{file.title || file.file_name}</p>
                      <span className="app-badge text-[0.62rem]">{file.file_type}</span>
                    </div>
                    <p className="app-text-muted mt-1 text-xs font-mono break-all">{file.source_path}</p>
                    <p className="app-text-soft mt-1 text-[11px]">
                      Updated: {new Date(file.updated_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
