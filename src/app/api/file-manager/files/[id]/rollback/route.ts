import { NextRequest, NextResponse } from "next/server";
import { getFileById, updateFile } from "@/lib/file-domain";
import { createAdminClient } from "@/lib/supabase";

function normalizeContent(content: string | null | undefined): string {
  return (content ?? "").replace(/\r\n/g, "\n");
}

function getStateContent(state: unknown): string {
  if (!state || typeof state !== "object") {
    return "";
  }
  const maybeContent = (state as { content?: unknown }).content;
  return typeof maybeContent === "string" ? maybeContent : "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const changeLogId = Number(body.change_log_id);

    if (!Number.isInteger(changeLogId) || changeLogId <= 0) {
      return NextResponse.json({ error: "Invalid change_log_id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: changeLog, error: changeLogError } = await admin
      .from("file_change_logs")
      .select("id,file_id,after_state")
      .eq("id", changeLogId)
      .eq("file_id", id)
      .maybeSingle();

    if (changeLogError) {
      throw changeLogError;
    }
    if (!changeLog) {
      return NextResponse.json({ error: "Change log not found" }, { status: 404 });
    }

    const currentFile = await getFileById(id, false);
    if (!currentFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const rollbackContent = getStateContent(changeLog.after_state);
    const beforeContent = normalizeContent(currentFile.content ?? "");
    const file = await updateFile(id, { content: rollbackContent }, { skipChangeLog: true });

    await admin.from("file_change_logs").insert({
      file_id: id,
      action: "file_rollback",
      before_state: { content: beforeContent },
      after_state: { content: rollbackContent },
    });

    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rollback";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
