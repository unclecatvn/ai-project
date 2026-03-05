import { NextResponse } from "next/server";
import { ensureFolderPath, upsertFileBySourcePath } from "@/lib/file-domain";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const IGNORED_DIRS = new Set([".git", "node_modules", ".next", ".vercel"]);
const INCLUDED_EXTS = new Set([".md", ".markdown", ".html"]);

function detectSensitivity(relativePath: string): "public" | "internal" | "restricted" {
  const normalized = relativePath.toLowerCase();
  if (normalized.includes("/secrets/") || normalized.includes("/private/")) {
    return "restricted";
  }
  if (normalized.includes("/internal/")) {
    return "internal";
  }
  return "public";
}

function toTitle(relativePath: string): string {
  return relativePath
    .replace(/\.[^/.]+$/, "")
    .replace(/[\\/]+/g, " / ")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function collectFiles(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      results.push(...(await collectFiles(abs, rel)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDED_EXTS.has(ext)) results.push(rel);
    }
  }
  return results;
}

/**
 * POST /api/files/sync
 * Syncs content/ directory to Supabase ai_files table.
 * Uses upsert on source_path to avoid duplicates.
 */
export async function POST() {
  try {
    let sourceFiles: string[];
    try {
      sourceFiles = await collectFiles(CONTENT_ROOT);
    } catch {
      return NextResponse.json({ error: "Content directory not found" }, { status: 500 });
    }

    let synced = 0;
    for (const relPath of sourceFiles) {
      const absPath = path.join(CONTENT_ROOT, relPath);
      const content = await readFile(absPath, "utf8");
      const fileName = path.basename(relPath);
      const ext = path.extname(fileName).toLowerCase();
      const fileType = ext === ".html" ? "html" : "markdown";
      const folderParts = relPath.split(/[\\/]/).slice(0, -1).filter(Boolean);
      const folderId = await ensureFolderPath(folderParts);

      await upsertFileBySourcePath({
        folder_id: folderId,
        title: toTitle(relPath),
        file_name: fileName,
        source_path: relPath,
        content,
        file_type: fileType,
        metadata: { imported_via: "sync-local" },
        sensitivity_level: detectSensitivity(relPath),
      });
      synced += 1;
    }

    return NextResponse.json({ success: true, synced });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
