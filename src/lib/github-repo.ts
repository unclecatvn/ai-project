type GithubApiErrorCode =
  | "rate_limited"
  | "repo_not_found"
  | "branch_unresolved"
  | "github_unreachable";

type GithubApiError = {
  ok: false;
  code: GithubApiErrorCode;
  message: string;
  status?: number;
};

type GithubApiSuccess<T> = {
  ok: true;
  data: T;
};

type GithubApiResult<T> = GithubApiSuccess<T> | GithubApiError;

export type ParsedGithubRepo = {
  owner: string;
  repo: string;
  nestedPath: string | null;
};

export type RepoDefaultBranch = {
  defaultBranch: string;
};

export type RepoFileContent = {
  content: string;
  sha: string | null;
  path: string;
};

const GITHUB_API_ACCEPT = "application/vnd.github.v3+json";

function createGithubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: GITHUB_API_ACCEPT,
    "User-Agent": "report-viewer",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractGithubError(response: Response, json: unknown): GithubApiError {
  const message =
    typeof json === "object" &&
    json !== null &&
    "message" in json &&
    typeof (json as { message?: unknown }).message === "string"
      ? (json as { message: string }).message
      : `GitHub request failed with status ${response.status}`;

  if (response.status === 404) {
    return {
      ok: false,
      code: "repo_not_found",
      message,
      status: response.status,
    };
  }

  if (response.status === 403 && /rate limit/i.test(message)) {
    return {
      ok: false,
      code: "rate_limited",
      message,
      status: response.status,
    };
  }

  return {
    ok: false,
    code: "github_unreachable",
    message,
    status: response.status,
  };
}

export function parseGithubRepoInput(input: string): ParsedGithubRepo | null {
  const cleaned = input
    .trim()
    .replace(/^git\+/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/tree\/[^/]+\//, "/")
    .replace(/\/$/, "");

  if (!cleaned || /\s/.test(cleaned)) {
    return null;
  }

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return {
    owner: parts[0],
    repo: parts[1],
    nestedPath: parts.slice(2).join("/") || null,
  };
}

export async function resolveRepoDefaultBranch(owner: string, repo: string): Promise<GithubApiResult<RepoDefaultBranch>> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const response = await fetch(apiUrl, { headers: createGithubHeaders() });
    const json = await safeJson(response);

    if (!response.ok) {
      return extractGithubError(response, json);
    }

    const branch =
      typeof json === "object" &&
      json !== null &&
      "default_branch" in json &&
      typeof (json as { default_branch?: unknown }).default_branch === "string"
        ? (json as { default_branch: string }).default_branch
        : null;

    if (!branch) {
      return {
        ok: false,
        code: "branch_unresolved",
        message: `Cannot resolve default branch for ${owner}/${repo}`,
      };
    }

    return {
      ok: true,
      data: { defaultBranch: branch },
    };
  } catch (error) {
    return {
      ok: false,
      code: "github_unreachable",
      message: error instanceof Error ? error.message : "Cannot reach GitHub",
    };
  }
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  branch: string,
  filePaths: string[]
): Promise<GithubApiResult<RepoFileContent>> {
  for (const filePath of filePaths) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    try {
      const response = await fetch(apiUrl, { headers: createGithubHeaders() });
      if (response.ok) {
        const json = await safeJson(response);
        const encodedContent =
          typeof json === "object" &&
          json !== null &&
          "content" in json &&
          typeof (json as { content?: unknown }).content === "string"
            ? (json as { content: string }).content
            : null;
        const sha =
          typeof json === "object" &&
          json !== null &&
          "sha" in json &&
          typeof (json as { sha?: unknown }).sha === "string"
            ? (json as { sha: string }).sha
            : null;

        if (encodedContent) {
          return {
            ok: true,
            data: {
              content: Buffer.from(encodedContent, "base64").toString("utf-8"),
              sha,
              path: filePath,
            },
          };
        }
      } else if (response.status === 403) {
        const json = await safeJson(response);
        const maybeError = extractGithubError(response, json);
        if (maybeError.code === "rate_limited") {
          // Fallback to raw endpoint when API is rate-limited.
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
          const rawResponse = await fetch(rawUrl);
          if (rawResponse.ok) {
            const content = await rawResponse.text();
            return {
              ok: true,
              data: {
                content,
                sha: null,
                path: filePath,
              },
            };
          }
        }
      }
    } catch {
      // Continue trying next path.
    }
  }

  return {
    ok: false,
    code: "github_unreachable",
    message: `Cannot load any requested file from ${owner}/${repo}@${branch}`,
  };
}

export async function fetchLatestCommitSha(
  owner: string,
  repo: string,
  branch: string,
  targetPath: string | null
): Promise<GithubApiResult<string | null>> {
  const commitsUrl = targetPath
    ? `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&path=${targetPath}&per_page=1`
    : `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=1`;

  try {
    const response = await fetch(commitsUrl, { headers: createGithubHeaders() });
    if (!response.ok) {
      const json = await safeJson(response);
      return extractGithubError(response, json);
    }

    const json = await safeJson(response);
    if (!Array.isArray(json) || json.length === 0) {
      return { ok: true, data: null };
    }

    const sha =
      typeof json[0] === "object" &&
      json[0] !== null &&
      "sha" in json[0] &&
      typeof (json[0] as { sha?: unknown }).sha === "string"
        ? (json[0] as { sha: string }).sha.slice(0, 12)
        : null;

    return { ok: true, data: sha };
  } catch (error) {
    return {
      ok: false,
      code: "github_unreachable",
      message: error instanceof Error ? error.message : "Cannot reach GitHub",
    };
  }
}

export function buildSkillFileCandidates(skillPath: string | null): string[] {
  const paths = new Set<string>(["SKILL.md", "skill.md", "README.md"]);
  if (!skillPath) {
    return Array.from(paths);
  }

  const trimmed = skillPath.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    return Array.from(paths);
  }

  const noPrefix = trimmed.replace(/^skills\//, "");
  const skillCandidates = new Set<string>([
    trimmed,
    noPrefix,
    `skills/${noPrefix}`,
  ]);

  if (!noPrefix.includes(".") && /-\d+$/.test(noPrefix)) {
    const dotZero = `${noPrefix}.0`;
    skillCandidates.add(dotZero);
    skillCandidates.add(`skills/${dotZero}`);
  }

  if (/\.\d+$/.test(noPrefix)) {
    const withoutMinor = noPrefix.replace(/\.\d+$/, "");
    skillCandidates.add(withoutMinor);
    skillCandidates.add(`skills/${withoutMinor}`);
  }

  for (const candidate of skillCandidates) {
    paths.add(`${candidate}/SKILL.md`);
    paths.add(`${candidate}/skill.md`);
    paths.add(`${candidate}/README.md`);
  }

  return Array.from(paths);
}

