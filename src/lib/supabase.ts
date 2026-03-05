import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "missing-anon-key";
const supabaseKey = supabaseAnonKey;

/**
 * Supabase client — uses the publishable default key per Supabase docs.
 * RLS policies enforce access control.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Server-only admin client using service role key for privileged operations.
 */
export function createAdminClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    supabaseAnonKey; // fallback to anon key in local dev
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/* ─── TypeScript Types ─── */

export type FileSensitivity = "public" | "internal" | "restricted";

export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  level: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FileTag = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type FileRecord = {
  id: string;
  folder_id: string | null;
  title: string;
  file_name: string;
  source_path: string;
  content: string | null;
  file_type: "markdown" | "html" | "yaml" | "json" | "text";
  size: number;
  public_path: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  sensitivity_level: FileSensitivity;
  owner_id: string | null;
  workspace_id: string | null;
  deleted_at: string | null;
  content_hash: string | null;
  signature: string | null;
  signature_algo: string | null;
  signature_key_id: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  folder?: Folder;
  tags?: FileTag[];
};

export type InstalledSkill = {
  id: number;
  name: string;
  description: string | null;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  skill_path: string;
  installed_version: string | null;
  latest_version: string | null;
  has_update: boolean;
  skill_content: string | null;
  default_branch: string | null;
  installed_at: string;
  updated_at: string;
};

