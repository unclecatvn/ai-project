import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Number.parseInt(limitParam ?? "30", 10);
    const safeLimit = Math.min(200, Math.max(1, Number.isFinite(limit) ? limit : 30));
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("file_change_logs")
      .select("id,file_id,action,before_state,after_state,created_at")
      .eq("file_id", id)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      throw error;
    }

    const logs = data ?? [];
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch history";
    return NextResponse.json({ error: message, logs: [] }, { status: 500 });
  }
}
