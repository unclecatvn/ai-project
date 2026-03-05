import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function safeCount(table, query) {
  try {
    const built = query(
      supabase.from(table).select("id", {
        count: "exact",
        head: true,
      }),
    );
    const { count, error } = await built;
    if (error) {
      return { table, count: null, error: error.message };
    }
    return { table, count: count ?? 0, error: null };
  } catch (error) {
    return { table, count: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const checks = await Promise.all([
    safeCount("ai_files", (q) => q),
    safeCount("ai_categories", (q) => q),
    safeCount("files", (q) => q),
    safeCount("folders", (q) => q),
    safeCount("file_tags", (q) => q),
    safeCount("installed_skills", (q) => q),
  ]);

  const duplicatePathResult = await supabase
    .from("files")
    .select("source_path")
    .eq("is_active", true);
  const duplicatePathError = duplicatePathResult.error?.message ?? null;
  const duplicateSourcePath = duplicatePathError
    ? null
    : duplicatePathResult.data.reduce((acc, row) => {
        const key = row.source_path || "";
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

  const duplicates =
    duplicateSourcePath === null
      ? null
      : Object.entries(duplicateSourcePath).filter(([, count]) => count > 1).length;

  const report = {
    generated_at: new Date().toISOString(),
    checks,
    duplicate_source_paths: duplicates,
    duplicate_source_paths_error: duplicatePathError,
    rollback_checklist: [
      "Keep a copy of current migration SQL files before applying reset migration",
      "Run migration on staging first",
      "Verify /api/file-manager/files and /api/files return expected shape",
      "Verify signature verification for create/read file path",
      "If any check fails, restore previous migration files and reset DB to previous snapshot",
    ],
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
