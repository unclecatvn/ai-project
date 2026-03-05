import { NextResponse } from "next/server";
import { getFileStats } from "@/lib/file-domain";

export async function GET() {
  try {
    const stats = await getFileStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
