import { NextRequest, NextResponse } from "next/server";
import { parseGithubRepoInput, resolveRepoDefaultBranch } from "@/lib/github-repo";

type ContentItem = {
  name: string;
  type: "file" | "dir";
  path: string;
};

/**
 * Fetch directory listing from GitHub Contents API.
 */
async function listGithubDir(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<ContentItem[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "report-viewer",
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map((item: { name: string; type: string; path: string }) => ({
      name: item.name,
      type: item.type as "file" | "dir",
      path: item.path,
    }));
  } catch {
    return [];
  }
}

/**
 * GET /api/skills/repo-contents?repo=owner/repo
 *
 * Returns all content items (skills, rules, agents, commands) from a GitHub repo.
 * This allows the UI to browse repo contents before installing.
 */
export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo");
  if (!repoParam) {
    return NextResponse.json({ error: "repo query parameter is required (e.g. owner/repo)" }, { status: 400 });
  }

  const parsed = parseGithubRepoInput(repoParam);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid repo format. Use: owner/repo" }, { status: 400 });
  }

  const { owner, repo } = parsed;

  const branchResult = await resolveRepoDefaultBranch(owner, repo);
  if (!branchResult.ok) {
    const status =
      branchResult.code === "repo_not_found" ? 404 :
      branchResult.code === "rate_limited" ? 429 :
      502;
    return NextResponse.json({ error: branchResult.message, code: branchResult.code }, { status });
  }
  const defaultBranch = branchResult.data.defaultBranch;

  // List root directory
  const rootItems = await listGithubDir(owner, repo, "", defaultBranch);
  const rootDirs = rootItems.filter((i) => i.type === "dir").map((i) => i.name);

  // Known content type folders
  const contentTypes = ["skills", "rules", "agents", "commands"] as const;

  const contents: Record<string, { name: string; type: "file" | "dir"; path: string }[]> = {};

  // Fetch contents of each known folder in parallel
  await Promise.all(
    contentTypes.map(async (folder) => {
      if (rootDirs.includes(folder)) {
        const items = await listGithubDir(owner, repo, folder, defaultBranch);
        contents[folder] = items.map((item) => ({
          name: item.name,
          type: item.type,
          path: item.path,
        }));
      } else {
        contents[folder] = [];
      }
    })
  );

  // Also check if root has SKILL.md (skill at repo root)
  const hasRootSkill = rootItems.some(
    (i) => i.type === "file" && ["SKILL.md", "skill.md"].includes(i.name)
  );

  return NextResponse.json({
    owner,
    repo,
    default_branch: defaultBranch,
    has_root_skill: hasRootSkill,
    root_dirs: rootDirs,
    contents,
  });
}
