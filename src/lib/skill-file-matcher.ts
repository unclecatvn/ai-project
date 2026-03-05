type SkillRef = {
  repo_owner: string;
  repo_name: string;
  skill_path: string;
};

type FileRef = {
  source_path: string;
  metadata: Record<string, unknown> | null;
};

function normalizePath(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^\/+|\/+$/g, "");
}

function getSkillPathCandidates(skillPath: string, repoName: string): {
  isRepoLevelInstall: boolean;
  candidates: string[];
} {
  const normalizedSkillPath = normalizePath(skillPath);
  const normalizedRepoName = normalizePath(repoName);
  if (!normalizedSkillPath || normalizedSkillPath === normalizedRepoName) {
    return { isRepoLevelInstall: true, candidates: [] };
  }

  const noPrefix = normalizedSkillPath.replace(/^skills\//, "");
  return {
    isRepoLevelInstall: false,
    candidates: Array.from(
      new Set([normalizedSkillPath, noPrefix, `skills/${noPrefix}`].map(normalizePath)),
    ).filter(Boolean),
  };
}

function toRepoSourcePrefix(owner: string, repo: string): string {
  return `github/${owner}/${repo}/`;
}

function isFileFromRepo(file: FileRef, owner: string, repo: string): boolean {
  const metadata = file.metadata ?? {};
  const repoOwner = typeof metadata.repo_owner === "string" ? metadata.repo_owner : null;
  const repoName = typeof metadata.repo_name === "string" ? metadata.repo_name : null;
  if (repoOwner === owner && repoName === repo) {
    return true;
  }
  return normalizePath(file.source_path).startsWith(normalizePath(toRepoSourcePrefix(owner, repo)));
}

function isFilePathMatch(filePath: string, candidates: string[]): boolean {
  const normalizedFilePath = normalizePath(filePath);
  return candidates.some(
    (candidate) =>
      normalizedFilePath === candidate || normalizedFilePath.startsWith(`${candidate}/`),
  );
}

export function isFileRelatedToSkill(file: FileRef, skill: SkillRef): boolean {
  if (!isFileFromRepo(file, skill.repo_owner, skill.repo_name)) {
    return false;
  }

  const { isRepoLevelInstall, candidates } = getSkillPathCandidates(
    skill.skill_path,
    skill.repo_name,
  );
  if (isRepoLevelInstall) {
    return true;
  }

  const metadata = file.metadata ?? {};
  const githubPath = typeof metadata.github_path === "string" ? metadata.github_path : null;
  if (githubPath && isFilePathMatch(githubPath, candidates)) {
    return true;
  }

  const repoPrefix = toRepoSourcePrefix(skill.repo_owner, skill.repo_name);
  const normalizedSourcePath = normalizePath(file.source_path);
  const normalizedRepoPrefix = normalizePath(repoPrefix);
  const sourceRelative = normalizedSourcePath.startsWith(normalizedRepoPrefix)
    ? normalizedSourcePath.slice(normalizedRepoPrefix.length)
    : normalizedSourcePath;
  return isFilePathMatch(sourceRelative, candidates);
}

export function getRepoSourcePrefix(owner: string, repo: string): string {
  return toRepoSourcePrefix(owner, repo);
}
