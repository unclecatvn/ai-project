import { NextRequest } from "next/server";
import { getFileBySourcePath } from "@/lib/file-domain";

function contentTypeFor(fileType: string) {
  switch (fileType) {
    case "html":
      return "text/html; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "yaml":
      return "text/yaml; charset=utf-8";
    case "text":
      return "text/plain; charset=utf-8";
    default:
      return "text/markdown; charset=utf-8";
  }
}

export async function GET(request: NextRequest) {
  const sourcePath = request.nextUrl.searchParams.get("source_path");
  const download = request.nextUrl.searchParams.get("download") !== "0";

  if (!sourcePath) {
    return new Response("source_path is required", { status: 400 });
  }

  const file = await getFileBySourcePath(sourcePath, true);
  if (!file || !file.content) {
    return new Response("File not found", { status: 404 });
  }

  const disposition = `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(file.file_name)}"`;
  return new Response(file.content, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(file.file_type),
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
