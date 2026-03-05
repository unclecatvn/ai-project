import { createAdminClient, supabase, type FileRecord, type Folder } from "@/lib/supabase";
import { signFilePayload, verifyFilePayload } from "@/lib/file-security";

const ACTIVE_FILE_SELECT =
  "id,folder_id,title,file_name,source_path,file_type,size,public_path,is_active,metadata,sensitivity_level,owner_id,workspace_id,deleted_at,content_hash,signature,signature_algo,signature_key_id,signed_at,created_at,updated_at,folder:folders(*)";

export type FileListQuery = {
  folderId?: string | null;
  fileType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  includeContent?: boolean;
  includeInactive?: boolean;
};

export type CreateFileInput = {
  folder_id: string | null;
  title: string;
  file_name: string;
  source_path: string;
  content: string;
  file_type: "markdown" | "html" | "yaml" | "json" | "text";
  metadata?: Record<string, unknown>;
  sensitivity_level?: "public" | "internal" | "restricted";
};

export type UpdateFileInput = Partial<
  Omit<CreateFileInput, "source_path"> & {
    is_active: boolean;
    source_path: string;
  }
>;

type UpdateFileOptions = {
  skipChangeLog?: boolean;
  changeLogAction?: ChangeAction;
  forceNewChangeVersion?: boolean;
};

type AuditAction =
  | "file_created"
  | "file_updated"
  | "file_deleted"
  | "file_read"
  | "signature_verify_failed";

type ChangeAction = "file_updated" | "file_rollback";

type ChangeState = {
  content: string;
};

export type FileChangeLogRecord = {
  id: number;
  file_id: string | null;
  action: ChangeAction;
  before_state: ChangeState | null;
  after_state: ChangeState | null;
  created_at: string;
};

const VERSION_WINDOW_MS = 5 * 60 * 1000;

async function writeAuditLog(action: AuditAction, fileId: string, detail?: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    await admin.from("file_access_logs").insert({
      file_id: fileId,
      action,
      detail: detail ?? {},
    });
  } catch {
    // Keep read/write path resilient before audit migration is applied.
  }
}

function getStateContent(state: unknown): string {
  if (!state || typeof state !== "object") {
    return "";
  }
  const maybeContent = (state as { content?: unknown }).content;
  return typeof maybeContent === "string" ? maybeContent : "";
}

async function writeChangeLogWithWindow(params: {
  fileId: string;
  action: ChangeAction;
  beforeContent: string;
  afterContent: string;
  forceNewVersion?: boolean;
}) {
  const { fileId, action, beforeContent, afterContent, forceNewVersion = false } = params;
  const admin = createAdminClient();

  const { data: latest, error: latestError } = await admin
    .from("file_change_logs")
    .select("id,action,before_state,created_at")
    .eq("file_id", fileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw latestError;
  }

  const canMergeIntoLatest =
    !forceNewVersion &&
    action === "file_updated" &&
    latest &&
    latest.action === "file_updated" &&
    Date.now() - new Date(latest.created_at as string).getTime() <= VERSION_WINDOW_MS;

  if (canMergeIntoLatest) {
    const mergedBeforeContent = getStateContent(latest.before_state) || beforeContent;
    const { error: updateError } = await admin
      .from("file_change_logs")
      .update({
        before_state: { content: mergedBeforeContent },
        after_state: { content: afterContent },
      })
      .eq("id", latest.id);

    if (updateError) {
      throw updateError;
    }
    return;
  }

  const { error: insertError } = await admin.from("file_change_logs").insert({
    file_id: fileId,
    action,
    before_state: { content: beforeContent },
    after_state: { content: afterContent },
  });

  if (insertError) {
    throw insertError;
  }
}

function normalizeContent(content: string | null | undefined): string {
  return (content ?? "").replace(/\r\n/g, "\n");
}

export async function listFolders(parentId: string | null = null): Promise<Folder[]> {
  let query = supabase
    .from("folders")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []) as Folder[];
}

export async function listFiles(query: FileListQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  let dbQuery = supabase
    .from("files")
    .select(
      query.includeContent ? ACTIVE_FILE_SELECT.replace("size,", "size,content,") : ACTIVE_FILE_SELECT,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!query.includeInactive) {
    dbQuery = dbQuery.eq("is_active", true);
  }
  if (query.folderId === null) {
    dbQuery = dbQuery.is("folder_id", null);
  } else if (query.folderId) {
    dbQuery = dbQuery.eq("folder_id", query.folderId);
  }
  if (query.fileType) {
    dbQuery = dbQuery.eq("file_type", query.fileType);
  }
  if (query.search?.trim()) {
    const keyword = query.search.trim();
    dbQuery = dbQuery.or(`title.ilike.%${keyword}%,file_name.ilike.%${keyword}%,source_path.ilike.%${keyword}%`);
  }

  const { data, error, count } = await dbQuery;
  if (error) {
    throw error;
  }

  return {
    files: (data ?? []) as unknown as FileRecord[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getFileById(id: string, verifySignatureOnRead = false): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from("files")
    .select(ACTIVE_FILE_SELECT.replace("size,", "size,content,"))
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  const file = data as unknown as FileRecord;
  if (!file.is_active) {
    return null;
  }

  if (verifySignatureOnRead && file.content && file.signature && file.signature_key_id && file.content_hash && file.signature_algo) {
    const verified = verifyFilePayload(
      {
        content: file.content,
        sourcePath: file.source_path,
        fileType: file.file_type,
      },
      {
        contentHash: file.content_hash,
        signature: file.signature,
        signatureAlgo: file.signature_algo as "hmac-sha256",
        signatureKeyId: file.signature_key_id,
      },
    );
    if (!verified) {
      await writeAuditLog("signature_verify_failed", file.id, {
        source_path: file.source_path,
      });
      return null;
    }
  }

  await writeAuditLog("file_read", file.id, { source_path: file.source_path });
  return file;
}

export async function getFileBySourcePath(
  sourcePath: string,
  verifySignatureOnRead = false,
): Promise<FileRecord | null> {
  const { data, error } = await supabase
    .from("files")
    .select(ACTIVE_FILE_SELECT.replace("size,", "size,content,"))
    .eq("source_path", sourcePath)
    .single();

  if (error) {
    return null;
  }

  const file = data as unknown as FileRecord;
  if (!file.is_active) {
    return null;
  }

  if (
    verifySignatureOnRead &&
    file.content &&
    file.signature &&
    file.signature_key_id &&
    file.content_hash &&
    file.signature_algo
  ) {
    const verified = verifyFilePayload(
      {
        content: file.content,
        sourcePath: file.source_path,
        fileType: file.file_type,
      },
      {
        contentHash: file.content_hash,
        signature: file.signature,
        signatureAlgo: file.signature_algo as "hmac-sha256",
        signatureKeyId: file.signature_key_id,
      },
    );
    if (!verified) {
      await writeAuditLog("signature_verify_failed", file.id, {
        source_path: file.source_path,
      });
      return null;
    }
  }

  await writeAuditLog("file_read", file.id, { source_path: file.source_path });
  return file;
}

export async function createFile(input: CreateFileInput): Promise<FileRecord> {
  const admin = createAdminClient();
  const content = normalizeContent(input.content);
  const signature = signFilePayload({
    content,
    sourcePath: input.source_path,
    fileType: input.file_type,
  });

  const { data, error } = await admin
    .from("files")
    .insert({
      folder_id: input.folder_id,
      title: input.title,
      file_name: input.file_name,
      source_path: input.source_path,
      content,
      file_type: input.file_type,
      size: new TextEncoder().encode(content).length,
      is_active: true,
      metadata: input.metadata ?? {},
      sensitivity_level: input.sensitivity_level ?? "internal",
      content_hash: signature.contentHash,
      signature: signature.signature,
      signature_algo: signature.signatureAlgo,
      signature_key_id: signature.signatureKeyId,
      signed_at: signature.signedAt,
      deleted_at: null,
    })
    .select(ACTIVE_FILE_SELECT.replace("size,", "size,content,"))
    .single();

  if (error) {
    throw error;
  }

  const file = data as unknown as FileRecord;
  await writeAuditLog("file_created", file.id, { source_path: file.source_path });
  return file;
}

export async function upsertFileBySourcePath(input: CreateFileInput): Promise<FileRecord> {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("files")
    .select("id")
    .eq("source_path", input.source_path)
    .maybeSingle();
  if (existingError) {
    throw existingError;
  }

  if (!existing?.id) {
    return createFile(input);
  }

  return updateFile(existing.id, {
    folder_id: input.folder_id,
    title: input.title,
    file_name: input.file_name,
    content: input.content,
    file_type: input.file_type,
    metadata: input.metadata,
    sensitivity_level: input.sensitivity_level,
    source_path: input.source_path,
    is_active: true,
  });
}

export async function updateFile(
  id: string,
  input: UpdateFileInput,
  options: UpdateFileOptions = {},
): Promise<FileRecord> {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  const needsCurrentForSignature = input.content !== undefined;
  let currentSourcePath: string | undefined;
  let currentFileType: string | undefined;
  let currentContent: string | undefined;

  if (needsCurrentForSignature) {
    const { data: current, error: currentError } = await admin
      .from("files")
      .select("source_path, file_type, content")
      .eq("id", id)
      .single();
    if (currentError) {
      throw currentError;
    }
    currentSourcePath = current.source_path;
    currentFileType = current.file_type;
    currentContent = normalizeContent(current.content ?? "");
  }

  if (input.folder_id !== undefined) updates.folder_id = input.folder_id;
  if (input.title !== undefined) updates.title = input.title;
  if (input.file_name !== undefined) updates.file_name = input.file_name;
  if (input.source_path !== undefined) updates.source_path = input.source_path;
  if (input.file_type !== undefined) updates.file_type = input.file_type;
  if (input.metadata !== undefined) updates.metadata = input.metadata;
  if (input.sensitivity_level !== undefined) updates.sensitivity_level = input.sensitivity_level;
  if (input.is_active !== undefined) {
    updates.is_active = input.is_active;
    updates.deleted_at = input.is_active ? null : new Date().toISOString();
  }

  if (input.content !== undefined) {
    const content = normalizeContent(input.content);
    updates.content = content;
    updates.size = new TextEncoder().encode(content).length;
    const sourcePath = (input.source_path ?? currentSourcePath ?? "") as string;
    const fileType = (input.file_type ?? currentFileType ?? "markdown") as string;
    const signature = signFilePayload({
      content,
      sourcePath,
      fileType,
    });
    updates.content_hash = signature.contentHash;
    updates.signature = signature.signature;
    updates.signature_algo = signature.signatureAlgo;
    updates.signature_key_id = signature.signatureKeyId;
    updates.signed_at = signature.signedAt;
  }

  const { data, error } = await admin
    .from("files")
    .update(updates)
    .eq("id", id)
    .select(ACTIVE_FILE_SELECT.replace("size,", "size,content,"))
    .single();

  if (error) {
    throw error;
  }

  const file = data as unknown as FileRecord;
  await writeAuditLog("file_updated", file.id, { source_path: file.source_path });

  if (input.content !== undefined && !options.skipChangeLog) {
    const beforeContent = currentContent ?? "";
    const afterContent = normalizeContent(file.content ?? "");
    if (beforeContent !== afterContent) {
      await writeChangeLogWithWindow({
        fileId: file.id,
        action: options.changeLogAction ?? "file_updated",
        beforeContent,
        afterContent,
        forceNewVersion: options.forceNewChangeVersion ?? false,
      });
    }
  }

  return file;
}

export async function listFileChangeLogs(fileId: string, limit = 30): Promise<FileChangeLogRecord[]> {
  const safeLimit = Math.min(200, Math.max(1, limit));
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("file_change_logs")
    .select("id,file_id,action,before_state,after_state,created_at")
    .eq("file_id", fileId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return (data ?? []) as FileChangeLogRecord[];
}

export async function rollbackFileToChangeLog(fileId: string, changeLogId: number): Promise<FileRecord> {
  const admin = createAdminClient();
  const { data: changeLog, error: changeLogError } = await admin
    .from("file_change_logs")
    .select("id,file_id,after_state")
    .eq("id", changeLogId)
    .eq("file_id", fileId)
    .maybeSingle();

  if (changeLogError) {
    throw changeLogError;
  }
  if (!changeLog) {
    throw new Error("Change log not found");
  }

  const currentFile = await getFileById(fileId, false);
  if (!currentFile) {
    throw new Error("File not found");
  }

  const rollbackContent = getStateContent(changeLog.after_state);
  const beforeContent = normalizeContent(currentFile.content ?? "");
  const file = await updateFile(
    fileId,
    { content: rollbackContent },
    { skipChangeLog: true },
  );

  await writeChangeLogWithWindow({
    fileId,
    action: "file_rollback",
    beforeContent,
    afterContent: rollbackContent,
    forceNewVersion: true,
  });

  return file;
}

export async function softDeleteFile(id: string) {
  const file = await updateFile(id, { is_active: false });
  await writeAuditLog("file_deleted", file.id, { source_path: file.source_path });
  return file;
}

export async function getFileStats() {
  const [totalFilesResult, totalFoldersResult, markdownResult, htmlResult] = await Promise.all([
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("folders").select("id", { count: "exact", head: true }),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_active", true).eq("file_type", "markdown"),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("is_active", true).eq("file_type", "html"),
  ]);

  return {
    totalFiles: totalFilesResult.count ?? 0,
    totalFolders: totalFoldersResult.count ?? 0,
    markdownFiles: markdownResult.count ?? 0,
    htmlFiles: htmlResult.count ?? 0,
  };
}

export async function ensureFolderPath(parts: string[]): Promise<string | null> {
  if (!parts.length) {
    return null;
  }

  const admin = createAdminClient();
  let parentId: string | null = null;

  for (const part of parts) {
    const existingResult: {
      data: { id: string } | null;
      error: { message: string } | null;
    } = await admin
      .from("folders")
      .select("id")
      .eq("name", part)
      .is("parent_id", parentId)
      .maybeSingle();
    if (existingResult.error) {
      throw new Error(existingResult.error.message);
    }
    if (existingResult.data?.id) {
      parentId = existingResult.data.id;
      continue;
    }

    const createdResult: {
      data: { id: string } | null;
      error: { message: string } | null;
    } = await admin
      .from("folders")
      .insert({
        name: part,
        parent_id: parentId,
      })
      .select("id")
      .single();
    if (createdResult.error) {
      throw new Error(createdResult.error.message);
    }
    if (!createdResult.data) {
      throw new Error("Failed to create folder");
    }
    parentId = createdResult.data.id;
  }

  return parentId;
}
