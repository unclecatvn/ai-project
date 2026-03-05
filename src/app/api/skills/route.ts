import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  buildSkillFileCandidates,
  fetchLatestCommitSha,
  fetchRepoFile,
  parseGithubRepoInput,
  resolveRepoDefaultBranch,
} from "@/lib/github-repo";

type NormalizedInstallInput = { repoUrl: string; skillName: string | null };

function parseNpxSkillsCommand(input: string): NormalizedInstallInput | null {
  const normalized = input.trim().replace(/\s+/g, " ");
  const match = normalized.match(/^npx\s+skills\s+add\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const rest = match[1];
  const skillMatch = rest.match(/\s--skill\s+([^\s]+)/i);
  const repoUrl = rest.replace(/\s--skill\s+[^\s]+/i, "").trim();
  const skillName = skillMatch?.[1]?.trim() ?? null;

  if (!repoUrl) {
    return null;
  }

  return { repoUrl, skillName };
}

function normalizeInstallInput(rawRepoUrl: string, rawSkillName?: string): NormalizedInstallInput {
  const parsedCommand = parseNpxSkillsCommand(rawRepoUrl);
  if (!parsedCommand) {
    return {
      repoUrl: rawRepoUrl.trim(),
      skillName: rawSkillName?.trim() || null,
    };
  }

  return {
    repoUrl: parsedCommand.repoUrl,
    skillName: rawSkillName?.trim() || parsedCommand.skillName || null,
  };
}

/**
 * Parse SKILL.md frontmatter for name and description.
 */
function parseSkillFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const result = { name: "", description: "" };
  if (!match) return result;

  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const value = kv[2].trim().replace(/^['"]|['"]$/g, "");
    if (key === "name") result.name = value;
    if (key === "description") result.description = value;
  }
  return result;
}

/**
 * GET /api/skills — list installed skills
 */
export async function GET() {
  const { data, error } = await supabase
    .from("installed_skills")
    .select("*")
    .order("installed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/skills — install a skill from Git repo
 * Body: { repo_url: "https://github.com/owner/repo", skill_name: "odoo-18" }
 *   or: { repo_url: "owner/repo/skill-name" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl: string = body.repo_url;
    const rawSkillName: string | undefined = body.skill_name;

    if (!rawUrl) {
      return NextResponse.json({ error: "repo_url is required" }, { status: 400 });
    }

    const normalizedInput = normalizeInstallInput(rawUrl, rawSkillName);
    const parsed = parseGithubRepoInput(normalizedInput.repoUrl);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid repo URL format. Use: owner/repo or https://github.com/owner/repo" }, { status: 400 });
    }

    // If skill_name is provided separately (like --skill odoo-18), override the path
    let skillPath = parsed.nestedPath;
    if (normalizedInput.skillName) {
      skillPath = normalizedInput.skillName;
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

    const resolvedSkillPath = skillPath;

    // Check if already installed
    const canonicalRepoUrl = resolvedSkillPath
      ? `${parsed.owner}/${parsed.repo}/${resolvedSkillPath.replace(/^skills\//, "")}`
      : `${parsed.owner}/${parsed.repo}`;

    const possibleRepoUrls = [canonicalRepoUrl];
    if (resolvedSkillPath) {
      possibleRepoUrls.push(`${parsed.owner}/${parsed.repo}/${resolvedSkillPath}`);
    }
    if (!resolvedSkillPath) {
      // Backward-compatibility for old normalized keys like owner/repo/repo
      possibleRepoUrls.push(`${parsed.owner}/${parsed.repo}/${parsed.repo}`);
    }

    const { data: existingRows } = await supabase
      .from("installed_skills")
      .select("id, repo_url")
      .in("repo_url", possibleRepoUrls)
      .limit(1);

    const existing = existingRows?.[0];

    if (existing) {
      return NextResponse.json({ error: "Skill already installed", id: existing.id }, { status: 409 });
    }

    // Fetch SKILL.md from GitHub using default branch.
    const fileResult = await fetchRepoFile(parsed.owner, parsed.repo, defaultBranch, buildSkillFileCandidates(resolvedSkillPath));
    if (!fileResult.ok) {
      return NextResponse.json({ error: `Could not find SKILL.md for "${resolvedSkillPath ?? "(root)"}" in ${parsed.owner}/${parsed.repo}. Try using exact skill name (e.g. odoo-18.0).` }, { status: 404 });
    }
    const skillData = fileResult.data;

    // Parse frontmatter
    const meta = parseSkillFrontmatter(skillData.content);
    const commitResult = await fetchLatestCommitSha(parsed.owner, parsed.repo, defaultBranch, resolvedSkillPath);
    const commitSha = commitResult.ok ? commitResult.data : null;

    const { data, error } = await supabase
      .from("installed_skills")
      .insert({
        name: meta.name || resolvedSkillPath || parsed.nestedPath || parsed.repo,
        description: meta.description || null,
        repo_url: canonicalRepoUrl,
        repo_owner: parsed.owner,
        repo_name: parsed.repo,
        skill_path: resolvedSkillPath || parsed.nestedPath || parsed.repo,
        installed_version: commitSha,
        latest_version: commitSha,
        has_update: false,
        skill_content: skillData.content,
        default_branch: defaultBranch,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
