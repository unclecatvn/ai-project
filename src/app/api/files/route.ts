import { NextRequest, NextResponse } from "next/server";
import { createFile, listFiles } from "@/lib/file-domain";

/**
 * GET /api/files
 * Compatibility endpoint mapped to unified files table.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  const fileType = params.get("file_type");
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 20)));
  const includeContent = params.get("include_content") === "true";

  try {
    const result = await listFiles({
      search: q ?? undefined,
      fileType: fileType ?? undefined,
      page,
      pageSize: limit,
      includeContent,
      includeInactive: false,
    });

    const data = result.files.map((file) => ({
      ...file,
      file_size: file.size,
      category_id: null,
      tags: [],
      ai_categories: null,
    }));

    return NextResponse.json({ data, count: result.total, page: result.page, limit: result.pageSize });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/files
 * Body: { category_slug, title, file_name, source_path, content, file_type, tags, metadata }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = await createFile({
      folder_id: null,
      title: body.title,
      file_name: body.file_name,
      source_path: body.source_path,
      content: body.content ?? "",
      file_type: body.file_type ?? "markdown",
      metadata: body.metadata ?? {},
      sensitivity_level: body.sensitivity_level ?? "internal",
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
