import { supabase, type FileRecord } from "@/lib/supabase";

export type AnalysisItem = {
  id: string;
  title: string;
  sourcePath: string;
  fileName: string;
  type: "markdown" | "html" | "yaml" | "json" | "text";
  publicPath: string | null;
  size: number;
  content: string | null;
  sensitivity: "public" | "internal" | "restricted";
  tags: string[];
  updatedAt: string;
};

export type ExplorerCategory = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co" &&
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function toAnalysisItem(file: FileRecord): AnalysisItem {
  const metadata = file.metadata ?? {};
  const metadataTags = Array.isArray(metadata.tags)
    ? metadata.tags.filter((value): value is string => typeof value === "string")
    : [];

  return {
    id: file.id,
    title: file.title,
    sourcePath: file.source_path,
    fileName: file.file_name,
    type: file.file_type,
    publicPath: file.public_path,
    size: file.size,
    content: file.content ?? null,
    sensitivity: file.sensitivity_level,
    tags: metadataTags,
    updatedAt: file.updated_at,
  };
}

export async function getCategories(): Promise<ExplorerCategory[]> {
  return [
    { id: "skills", slug: "skills", label: "Skills", icon: "zap", sort_order: 1, created_at: "" },
    { id: "subagents", slug: "subagents", label: "Subagents", icon: "bot", sort_order: 2, created_at: "" },
    { id: "rules", slug: "rules", label: "Rules", icon: "shield", sort_order: 3, created_at: "" },
    { id: "commands", slug: "commands", label: "Commands", icon: "terminal", sort_order: 4, created_at: "" },
    { id: "markdown", slug: "markdown", label: "Markdown", icon: "file-text", sort_order: 5, created_at: "" },
    { id: "html", slug: "html", label: "HTML", icon: "code", sort_order: 6, created_at: "" },
  ];
}

export async function getFilesByCategory(
  categorySlug?: string,
  opts?: { q?: string; limit?: number; page?: number }
): Promise<{ files: FileRecord[]; count: number }> {
  if (!isSupabaseConfigured) {
    return { files: [], count: 0 };
  }

  const limit = opts?.limit ?? 50;
  const page = opts?.page ?? 1;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("files")
    .select("id,title,file_name,source_path,file_type,size,public_path,metadata,sensitivity_level,updated_at", { count: "exact" })
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    if (categorySlug === "html" || categorySlug === "markdown") {
      query = query.eq("file_type", categorySlug);
    } else {
      query = query.like("source_path", `${categorySlug}/%`);
    }
  }

  if (opts?.q) {
    query = query.or(
      `title.ilike.%${opts.q}%,file_name.ilike.%${opts.q}%`
    );
  }

  const { data, count } = await query;
  return { files: (data as FileRecord[]) ?? [], count: count ?? 0 };
}

export async function getAllAnalysisItems(categorySlug?: string): Promise<AnalysisItem[]> {
  const normalized = categorySlug && categorySlug !== "all" ? categorySlug : undefined;
  const { files } = await getFilesByCategory(normalized, { limit: 300, page: 1 });
  return files.map(toAnalysisItem);
}

export async function getAnalysisItemBySourcePath(sourcePath: string): Promise<AnalysisItem | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from("files")
    .select("id,title,file_name,source_path,file_type,size,public_path,metadata,sensitivity_level,updated_at,content")
    .eq("source_path", sourcePath)
    .eq("is_active", true)
    .single();
  if (!data) return null;
  return toAnalysisItem(data as FileRecord);
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from("files")
    .select("*, folder:folders(*)")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data as FileRecord | null;
}

export { isSupabaseConfigured };
