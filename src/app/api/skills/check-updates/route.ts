import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchLatestCommitSha, resolveRepoDefaultBranch } from "@/lib/github-repo";

/**
 * POST /api/skills/check-updates
 * Checks all installed skills against GitHub for newer commits.
 * Updates has_update flag and latest_version.
 */
export async function POST() {
  const { data: skills, error } = await supabase
    .from("installed_skills")
    .select("*");

  if (error || !skills) {
    return NextResponse.json({ error: error?.message ?? "No skills" }, { status: 500 });
  }

  const results: { id: number; name: string; has_update: boolean; latest_version: string | null }[] = [];

  // Check all skills in parallel
  await Promise.all(
    skills.map(async (skill) => {
      const resolvedBranch =
        typeof skill.default_branch === "string" && skill.default_branch.trim()
          ? skill.default_branch.trim()
          : null;
      const branchResult = resolvedBranch
        ? { ok: true as const, data: { defaultBranch: resolvedBranch } }
        : await resolveRepoDefaultBranch(skill.repo_owner, skill.repo_name);
      if (!branchResult.ok) {
        return;
      }

      const commitResult = await fetchLatestCommitSha(
        skill.repo_owner,
        skill.repo_name,
        branchResult.data.defaultBranch,
        skill.skill_path !== skill.repo_name ? skill.skill_path : null
      );
      if (!commitResult.ok || commitResult.data === null) {
        return;
      }

      const latestSha = commitResult.data;
      const hasUpdate = latestSha !== skill.installed_version;

      await supabase
        .from("installed_skills")
        .update({
          latest_version: latestSha,
          has_update: hasUpdate,
          default_branch: branchResult.data.defaultBranch,
        })
        .eq("id", skill.id);

      results.push({
        id: skill.id,
        name: skill.name,
        has_update: hasUpdate,
        latest_version: latestSha,
      });
    })
  );

  return NextResponse.json({
    checked: results.length,
    updates_available: results.filter((r) => r.has_update).length,
    results,
  });
}

