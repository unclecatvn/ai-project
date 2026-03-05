import { NextRequest, NextResponse } from "next/server";
import { getFileById, softDeleteFile, updateFile } from "@/lib/file-domain";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/files/[id]
 * Returns file with full content
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const data = await getFileById(id, true);
  if (!data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/files/[id]
 * Body: partial update fields
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    if (
      body.title === undefined &&
      body.content === undefined &&
      body.file_name === undefined &&
      body.metadata === undefined &&
      body.file_type === undefined &&
      body.source_path === undefined &&
      body.is_active === undefined &&
      body.folder_id === undefined &&
      body.sensitivity_level === undefined
    ) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const data = await updateFile(id, body);

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/files/[id]
 * Soft delete — sets is_deleted = true
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await softDeleteFile(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
