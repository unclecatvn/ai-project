import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
  title: string;
  file_name: string;
  source_path: string;
  file_type: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
};

/**
 * GET /api/skills/[id]/files
 * List explorer files related to a skill.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
    .select("id, title, file_name, source_path, file_type, updated_at, metadata")
    .eq("is_active", true)
    .like("source_path", getRepoSourcePrefix(skill.repo_owner, skill.repo_name) + "%")
    .order("updated_at", { ascending: false })
    .returns<FileRecord[]>();

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  const files = (repoFiles ?? [])
    .filter((file) => isFileRelatedToSkill(file, skill))
    .map((file) => ({
      id: file.id,
      title: file.title,
      file_name: file.file_name,
      source_path: file.source_path,
      file_type: file.file_type,
      updated_at: file.updated_at,
    }));

  return NextResponse.json({
    data: files,
    skill: {
      id: skill.id,
      repo_owner: skill.repo_owner,
      repo_name: skill.repo_name,
      skill_path: skill.skill_path,
    },
  });
}
