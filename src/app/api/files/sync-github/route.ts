import { NextRequest, NextResponse } from "next/server";
import { fetchRepoFile, parseGithubRepoInput, resolveRepoDefaultBranch } from "@/lib/github-repo";
import { ensureFolderPath, upsertFileBySourcePath } from "@/lib/file-domain";

const INCLUDED_EXTS = new Set([".md", ".markdown", ".html"]);
const CATEGORY_DIR_MAP: Record<string, "skills" | "subagents" | "rules" | "commands"> = {
  skills: "skills",
  agents: "subagents",
  rules: "rules",
  commands: "commands",
};

type RepoTreeNode = {
  path: string;
  type: "blob" | "tree";
};

function parseNpxSkillsCommand(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^npx\s+skills\s+add\s+(.+)$/i);
  if (!match) {
    return input.trim();
  }
  return match[1].replace(/\s--skill\s+[^\s]+/i, "").trim();
}

function detectCategoryByPath(filePath: string): "skills" | "subagents" | "rules" | "commands" | null {
  const root = filePath.split("/")[0]?.toLowerCase();
  return CATEGORY_DIR_MAP[root] ?? null;
}

function toTitle(relativePath: string): string {
  return relativePath
    .replace(/\.[^/.]+$/, "")
    .replace(/[\\/]+/g, " / ")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getGithubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "report-viewer",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

async function fetchRepoTree(owner: string, repo: string, branch: string): Promise<RepoTreeNode[] | null> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  try {
    const response = await fetch(apiUrl, { headers: getGithubHeaders() });
    if (!response.ok) {
      return null;
    }
    const json = await response.json();
    if (!json || !Array.isArray(json.tree)) {
      return null;
    }
    return json.tree
      .filter((node: unknown) => {
        if (!node || typeof node !== "object") return false;
        const maybe = node as { path?: unknown; type?: unknown };
        return typeof maybe.path === "string" && (maybe.type === "blob" || maybe.type === "tree");
      })
      .map((node: { path: string; type: "blob" | "tree" }) => ({ path: node.path, type: node.type }));
  } catch {
    return null;
  }
}

/**
 * POST /api/files/sync-github
 * Body:
 * {
 *   repo_url: "https://github.com/owner/repo" | "owner/repo" | "npx skills add ...",
 *   categories?: ["skills" | "subagents" | "rules" | "commands"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawRepoUrl = typeof body.repo_url === "string" ? body.repo_url : "";
    if (!rawRepoUrl.trim()) {
      return NextResponse.json({ error: "repo_url is required" }, { status: 400 });
    }

    const parsed = parseGithubRepoInput(parseNpxSkillsCommand(rawRepoUrl));
    if (!parsed) {
      return NextResponse.json({ error: "Invalid repo URL format" }, { status: 400 });
    }

    const requestedCategories: string[] = Array.isArray(body.categories)
      ? body.categories.filter((item: unknown): item is string => typeof item === "string")
      : ["skills"];
    const categoryScope = new Set(
      requestedCategories
        .map((item) => item.toLowerCase())
        .filter((item) => item === "skills" || item === "subagents" || item === "rules" || item === "commands")
    );
    if (categoryScope.size === 0) {
      categoryScope.add("skills");
    }

    const branchResult = await resolveRepoDefaultBranch(parsed.owner, parsed.repo);
    if (!branchResult.ok) {
      const status =
        branchResult.code === "repo_not_found" ? 404 :
        branchResult.code === "rate_limited" ? 429 :
        502;
      return NextResponse.json({ error: branchResult.message, code: branchResult.code }, { status });
    }
    const defaultBranch = branchResult.data.defaultBranch;

    const tree = await fetchRepoTree(parsed.owner, parsed.repo, defaultBranch);
    if (!tree) {
      return NextResponse.json({ error: "Cannot read repository tree from GitHub" }, { status: 502 });
    }

    const filteredFilePaths = tree
      .filter((node) => node.type === "blob")
      .map((node) => node.path)
      .filter((repoPath) => {
        const ext = repoPath.slice(repoPath.lastIndexOf(".")).toLowerCase();
        if (!INCLUDED_EXTS.has(ext)) return false;
        const category = detectCategoryByPath(repoPath);
        return category !== null && categoryScope.has(category);
      });

    if (filteredFilePaths.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: "No matching files found in selected categories.",
      });
    }

    let imported = 0;
    for (const repoPath of filteredFilePaths) {
      const category = detectCategoryByPath(repoPath);
      if (!category) continue;

      const fileResult = await fetchRepoFile(parsed.owner, parsed.repo, defaultBranch, [repoPath]);
      if (!fileResult.ok) continue;

      const fileName = repoPath.split("/").pop() ?? repoPath;
      const fileType = fileName.toLowerCase().endsWith(".html") ? "html" : "markdown";
      const sourcePath = `github/${parsed.owner}/${parsed.repo}/${repoPath}`;
      const content = fileResult.data.content;
      const folderParts = repoPath.split("/").slice(0, -1).filter(Boolean);
      const folderId = await ensureFolderPath([category, ...folderParts]);

      await upsertFileBySourcePath({
        folder_id: folderId,
        title: toTitle(repoPath),
        file_name: fileName,
        source_path: sourcePath,
        content,
        file_type: fileType,
        metadata: {
          repo_owner: parsed.owner,
          repo_name: parsed.repo,
          repo_url: `${parsed.owner}/${parsed.repo}`,
          default_branch: defaultBranch,
          github_path: repoPath,
          imported_via: "sync-github",
        },
        sensitivity_level: "public",
      });
      imported += 1;
    }

    if (imported === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: "No readable files could be imported.",
      });
    }

    return NextResponse.json({
      success: true,
      imported,
      default_branch: defaultBranch,
      repo: `${parsed.owner}/${parsed.repo}`,
      categories: Array.from(categoryScope),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

