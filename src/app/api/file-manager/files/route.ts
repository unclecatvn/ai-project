import { NextRequest, NextResponse } from "next/server";
import { createFile, listFiles } from "@/lib/file-domain";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderIdParam = searchParams.get("folder_id");
    const folderId = folderIdParam === "null" || folderIdParam === "" ? null : folderIdParam;
    const fileType = searchParams.get("file_type") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("page_size") || "50", 10);

    const result = await listFiles({
      folderId,
      fileType,
      search,
      page,
      pageSize,
      includeContent: false,
      includeInactive: false,
    });

    return NextResponse.json({
      files: result.files,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch files";
    return NextResponse.json({ error: message, files: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.file_name) {
      return NextResponse.json(
        { error: "Missing required fields: title and file_name are required" },
        { status: 400 },
      );
    }

    const file = await createFile({
      folder_id: body.folder_id || null,
      title: body.title,
      file_name: body.file_name,
      source_path: body.source_path || `custom/${Date.now()}_${body.file_name}`,
      file_type: body.file_type || "markdown",
      content: body.content || "",
      metadata: body.metadata ?? {},
      sensitivity_level: body.sensitivity_level ?? "internal",
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
