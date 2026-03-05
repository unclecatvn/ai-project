import { NextRequest, NextResponse } from "next/server";
import { getFileBySourcePath } from "@/lib/file-domain";

export async function GET(request: NextRequest) {
  const sourcePath = request.nextUrl.searchParams.get("source_path");
  if (!sourcePath) {
    return NextResponse.json({ error: "source_path is required" }, { status: 400 });
  }

  try {
    const file = await getFileBySourcePath(sourcePath, true);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
