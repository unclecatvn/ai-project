import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { listFolders } from "@/lib/file-domain";

export async function GET(request: NextRequest) {
  try {
    const parentIdParam = request.nextUrl.searchParams.get("parent_id");
    const parentId = parentIdParam === "null" || parentIdParam === "" ? null : parentIdParam;
    const folders = await listFolders(parentId);
    return NextResponse.json({ folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch folders";
    return NextResponse.json({ error: message, folders: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("folders")
      .insert({
        name: body.name,
        parent_id: body.parent_id || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ folder: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
