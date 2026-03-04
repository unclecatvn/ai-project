import { watch } from "node:fs";
import { mkdir, readFile, rm, writeFile, copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const contentRoot = path.join(projectRoot, "content");
const outputDir = path.join(projectRoot, "public", "analysis");
const manifestPath = path.join(projectRoot, "src", "data", "analysis-manifest.json");

const includedExtensions = new Set([".md", ".markdown", ".html"]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".vercel",
]);

function toTitle(relativePath) {
  return relativePath
    .replace(/\.[^/.]+$/, "")
    .replace(/[\\/]+/g, " / ")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function collectSourceFiles(currentDirectory, relativePrefix = "") {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const relativePath = path.join(relativePrefix, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || ignoredDirectories.has(entry.name)) {
        continue;
      }
      const nestedFiles = await collectSourceFiles(absolutePath, relativePath);
      results.push(...nestedFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!includedExtensions.has(extension)) {
      continue;
    }

    results.push(relativePath);
  }

  return results;
}

async function syncFiles() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const manifest = [];
  let sourceFiles = [];
  try {
    sourceFiles = await collectSourceFiles(contentRoot);
  } catch (error) {
    console.error("Khong tim thay thu muc content/. Hay tao report-viewer/content truoc khi build.");
    throw error;
  }

  for (const relativeSourcePath of sourceFiles) {
    const absoluteSourcePath = path.join(contentRoot, relativeSourcePath);
    const baseName = path.basename(relativeSourcePath);
    const destinationName = relativeSourcePath.replace(/[\\/]/g, "__");
    const absoluteDestinationPath = path.join(outputDir, destinationName);

    try {
      await copyFile(absoluteSourcePath, absoluteDestinationPath);
      const statSafeContent = await readFile(absoluteSourcePath, "utf8");
      const type = baseName.toLowerCase().endsWith(".html") ? "html" : "markdown";

      manifest.push({
        id: destinationName,
        title: toTitle(relativeSourcePath),
        sourcePath: relativeSourcePath,
        fileName: baseName,
        type,
        publicPath: `/analysis/${destinationName}`,
        size: statSafeContent.length,
      });
    } catch (error) {
      console.warn(`Skipping missing or unreadable file: ${relativeSourcePath}`);
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  manifest.sort((first, second) => first.sourcePath.localeCompare(second.sourcePath, "vi"));

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifest.length;
}

async function run() {
  const watchMode = process.argv.includes("--watch");
  let syncInProgress = false;
  let syncQueued = false;
  let debounceTimer = null;

  async function runSync() {
    if (syncInProgress) {
      syncQueued = true;
      return;
    }

    syncInProgress = true;
    do {
      syncQueued = false;
      const syncedCount = await syncFiles();
      console.log(`Synced ${syncedCount} analysis files.`);
    } while (syncQueued);
    syncInProgress = false;
  }

  await runSync();

  if (!watchMode) {
    return;
  }

  console.log(`Watching for changes in: ${contentRoot}`);
  const watcher = watch(contentRoot, { recursive: true }, (_eventType, fileName) => {
    if (!fileName) {
      return;
    }

    const normalized = fileName.toString().replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);
    if (segments.some((segment) => segment.startsWith(".") || ignoredDirectories.has(segment))) {
      return;
    }

    const extension = path.extname(normalized).toLowerCase();
    if (extension && !includedExtensions.has(extension)) {
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      runSync().catch((error) => {
        console.error("Failed to sync analysis files.");
        console.error(error);
      });
    }, 200);
  });

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    watcher.close();
    process.exit(0);
  });

  await new Promise(() => {});
}

run().catch((error) => {
  console.error("Failed to sync analysis files.");
  console.error(error);
  process.exit(1);
});
