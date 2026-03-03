import { mkdir, readFile, rm, writeFile, copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const workspaceRoot = path.resolve(projectRoot, "..");
const outputDir = path.join(projectRoot, "public", "analysis");
const manifestPath = path.join(projectRoot, "src", "data", "analysis-manifest.json");

const includedExtensions = new Set([".md", ".markdown", ".html"]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".vercel",
  "report-viewer",
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

async function run() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const manifest = [];
  const sourceFiles = await collectSourceFiles(workspaceRoot);

  for (const relativeSourcePath of sourceFiles) {
    const absoluteSourcePath = path.join(workspaceRoot, relativeSourcePath);
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
  console.log(`Synced ${manifest.length} analysis files.`);
}

run().catch((error) => {
  console.error("Failed to sync analysis files.");
  console.error(error);
  process.exit(1);
});
