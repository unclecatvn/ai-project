import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  buildSkillFileCandidates,
  fetchLatestCommitSha,
  fetchRepoFile,
  resolveRepoDefaultBranch,
} from "@/lib/github-repo";
import { getRepoSourcePrefix, isFileRelatedToSkill } from "@/lib/skill-file-matcher";

type RouteParams = { params: Promise<{ id: string }> };
type SkillRecord = {
  id: number;
  repo_owner: string;
  repo_name: string;
  skill_path: string;
};
type FileRecord = {
  id: string;
  source_path: string;
  metadata: Record<string, unknown> | null;
};

/**
 * GET /api/skills/[id] — get skill detail
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("installed_skills")
    .select("*")
    .eq("id", numId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/skills/[id] — update skill to latest version
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Get current skill
  const { data: skill } = await supabase
    .from("installed_skills")
    .select("*")
    .eq("id", numId)
    .single();

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const resolvedBranch =
    typeof skill.default_branch === "string" && skill.default_branch.trim()
      ? skill.default_branch.trim()
      : null;
  const branchResult = resolvedBranch
    ? { ok: true as const, data: { defaultBranch: resolvedBranch } }
    : await resolveRepoDefaultBranch(skill.repo_owner, skill.repo_name);

  if (!branchResult.ok) {
    const status = branchResult.code === "repo_not_found" ? 404 : branchResult.code === "rate_limited" ? 429 : 502;
    return NextResponse.json({ error: branchResult.message, code: branchResult.code }, { status });
  }
  const branch = branchResult.data.defaultBranch;

  const fileResult = await fetchRepoFile(
    skill.repo_owner,
    skill.repo_name,
    branch,
    buildSkillFileCandidates(skill.skill_path)
  );
  const newContent = fileResult.ok ? fileResult.data.content : null;

  const commitResult = await fetchLatestCommitSha(
    skill.repo_owner,
    skill.repo_name,
    branch,
    skill.skill_path !== skill.repo_name ? skill.skill_path : null
  );
  const latestSha = commitResult.ok ? commitResult.data : null;

  // Parse frontmatter from new content
  let name = skill.name;
  let description = skill.description;
  if (newContent) {
    const match = newContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
      for (const line of match[1].split(/\r?\n/)) {
        const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
        if (!kv) continue;
        const key = kv[1].toLowerCase();
        const value = kv[2].trim().replace(/^['"]|['"]$/g, "");
        if (key === "name") name = value;
        if (key === "description") description = value;
      }
    }
  }

  const { data, error } = await supabase
    .from("installed_skills")
    .update({
      name,
      description,
      skill_content: newContent ?? skill.skill_content,
      installed_version: latestSha ?? skill.installed_version,
      latest_version: latestSha ?? skill.latest_version,
      has_update: false,
      default_branch: branch,
    })
    .eq("id", numId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/skills/[id] — uninstall skill
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data: skill, error: skillError } = await supabase
    .from("installed_skills")
    .select("id, repo_owner, repo_name, skill_path")
    .eq("id", numId)
    .single<SkillRecord>();

  if (skillError || !skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const { data: repoFiles, error: filesError } = await supabase
    .from("files")
    .select("id, source_path, metadata")
    .eq("is_active", true)
    .like("source_path", getRepoSourcePrefix(skill.repo_owner, skill.repo_name) + "%")
    .returns<FileRecord[]>();

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  const relatedFileIds = (repoFiles ?? [])
    .filter((file) => isFileRelatedToSkill(file, skill))
    .map((file) => file.id);

  if (relatedFileIds.length > 0) {
    const BATCH_SIZE = 500;
    for (let index = 0; index < relatedFileIds.length; index += BATCH_SIZE) {
      const batch = relatedFileIds.slice(index, index + BATCH_SIZE);
      const { error: deleteFilesError } = await supabase
        .from("files")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .in("id", batch);
      if (deleteFilesError) {
        return NextResponse.json({ error: deleteFilesError.message }, { status: 500 });
      }
    }
  }

  const { error } = await supabase
    .from("installed_skills")
    .delete()
    .eq("id", numId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted_files: relatedFileIds.length });
}
