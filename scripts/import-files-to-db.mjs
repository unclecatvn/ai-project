import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function loadEnvFile(filePath) {
  let raw = "";
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = value.replace(/^['"]|['"]$/g, "");
  }
}

await loadEnvFile(path.join(projectRoot, ".env.local"));
await loadEnvFile(path.join(projectRoot, ".env"));

// Cấu hình
const CONTENT_DIR = path.join(projectRoot, "content");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const FILE_SIGNATURE_SECRET = process.env.FILE_SIGNATURE_SECRET || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
  process.exit(1);
}
if (!FILE_SIGNATURE_SECRET) {
  console.error("FILE_SIGNATURE_SECRET is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const INCLUDED_EXTENSIONS = new Set([".md", ".markdown", ".html"]);
const IGNORED_DIRS = new Set([".git", "node_modules", ".next", ".vercel"]);
const folderCache = new Map();
folderCache.set("", null);

function toTitle(relativePath) {
  return relativePath
    .replace(/\.[^/.]+$/, "")
    .replace(/[\\/]+/g, " / ")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseFolderStructure(relativePath) {
  const parts = relativePath.split(/[\\/]/);
  const fileName = parts.pop();
  const folderPath = parts.join("/");
  return { fileName, folderPath, parts };
}

function signPayload(content, sourcePath, fileType) {
  const canonical = JSON.stringify({
    content: content.replace(/\r\n/g, "\n"),
    sourcePath,
    fileType,
  });
  const contentHash = crypto.createHash("sha256").update(canonical).digest("hex");
  const signature = crypto.createHmac("sha256", FILE_SIGNATURE_SECRET).update(contentHash).digest("base64url");
  return { contentHash, signature };
}

async function getOrCreateFolder(folderPath) {
  if (folderCache.has(folderPath)) {
    return folderCache.get(folderPath);
  }

  const parts = folderPath.split("/").filter(Boolean);
  if (!parts.length) {
    return null;
  }

  let currentPath = "";
  let parentId = null;
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    if (folderCache.has(currentPath)) {
      parentId = folderCache.get(currentPath);
      continue;
    }

    const folderLookup = parentId
      ? await supabase
          .from("folders")
          .select("id")
          .eq("name", part)
          .eq("parent_id", parentId)
          .maybeSingle()
      : await supabase
          .from("folders")
          .select("id")
          .eq("name", part)
          .is("parent_id", null)
          .maybeSingle();
    if (folderLookup.error) {
      throw folderLookup.error;
    }
    if (folderLookup.data?.id) {
      parentId = folderLookup.data.id;
      folderCache.set(currentPath, parentId);
      continue;
    }

    const { data: newFolder, error } = await supabase
      .from("folders")
      .insert({ name: part, parent_id: parentId, sort_order: 0 })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    parentId = newFolder.id;
    folderCache.set(currentPath, parentId);
  }
  folderCache.set(folderPath, parentId);
  return parentId;
}

async function readFileContent(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function collectFiles(dir, prefix = "") {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      const subFiles = await collectFiles(fullPath, relativePath);
      files.push(...subFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!INCLUDED_EXTENSIONS.has(ext)) {
      continue;
    }

    files.push({ relativePath, fullPath, fileName: entry.name, ext });
  }
  return files;
}

async function importFile(fileInfo) {
  const { relativePath, fullPath, fileName, ext } = fileInfo;
  const content = await readFileContent(fullPath);
  if (content === null) return "error";

  const { folderPath } = parseFolderStructure(relativePath);
  const folderId = await getOrCreateFolder(folderPath);
  const fileType = ext === ".html" ? "html" : "markdown";
  const publicPath = `/analysis/${relativePath.replace(/[\\/]/g, "__")}`;
  const signature = signPayload(content, relativePath, fileType);

  const { data: existing, error: existingError } = await supabase
    .from("files")
    .select("id")
    .eq("source_path", relativePath)
    .maybeSingle();
  if (existingError) {
    console.error(existingError.message);
    return "error";
  }

  if (!existing?.id) {
    const { error } = await supabase.from("files").insert({
      folder_id: folderId,
      title: toTitle(relativePath),
      file_name: fileName,
      source_path: relativePath,
      file_type: fileType,
      content,
      size: new TextEncoder().encode(content).length,
      public_path: publicPath,
      is_active: true,
      metadata: { imported_via: "scripts/import-files-to-db" },
      sensitivity_level: "public",
      content_hash: signature.contentHash,
      signature: signature.signature,
      signature_algo: "hmac-sha256",
      signature_key_id: "default",
      signed_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`Insert failed: ${relativePath}`, error.message);
      if (error.message?.includes("row-level security policy")) {
        console.error("RLS blocked write access. Use a server/service key or create insert/update policy for this role.");
      }
      return "error";
    }
    return "success";
  }

  const { error } = await supabase
    .from("files")
    .update({
      folder_id: folderId,
      title: toTitle(relativePath),
      file_name: fileName,
      file_type: fileType,
      content,
      size: new TextEncoder().encode(content).length,
      public_path: publicPath,
      is_active: true,
      deleted_at: null,
      metadata: { imported_via: "scripts/import-files-to-db" },
      content_hash: signature.contentHash,
      signature: signature.signature,
      signature_algo: "hmac-sha256",
      signature_key_id: "default",
      signed_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (error) {
    console.error(`Update failed: ${relativePath}`, error.message);
    if (error.message?.includes("row-level security policy")) {
      console.error("RLS blocked write access. Use a server/service key or create insert/update policy for this role.");
    }
    return "error";
  }
  return "success";
}

async function importAllFiles() {
  console.log("Scanning files from content/ ...");
  const files = await collectFiles(CONTENT_DIR);
  if (!files.length) {
    console.log("No files found.");
    return;
  }

  let success = 0;
  let errors = 0;
  for (const file of files) {
    const result = await importFile(file);
    if (result === "success") {
      success += 1;
    } else {
      errors += 1;
    }
  }
  console.log(`Done. success=${success}, errors=${errors}, total=${files.length}`);
}

importAllFiles().catch(console.error);
