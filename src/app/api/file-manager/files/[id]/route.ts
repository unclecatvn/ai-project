import { NextRequest, NextResponse } from "next/server";
import { getFileById, softDeleteFile, updateFile } from "@/lib/file-domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await getFileById(id, true);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const file = await updateFile(id, {
      title: body.title,
      content: body.content,
      is_active: body.is_active,
      file_name: body.file_name,
      file_type: body.file_type,
      folder_id: body.folder_id,
      metadata: body.metadata,
      sensitivity_level: body.sensitivity_level,
      source_path: body.source_path,
    });

    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await softDeleteFile(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
