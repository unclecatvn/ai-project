import { NextResponse } from "next/server";

const CATEGORY_VIEW = [
  { id: "skills", slug: "skills", label: "Skills", icon: "zap", sort_order: 1 },
  { id: "subagents", slug: "subagents", label: "Subagents", icon: "bot", sort_order: 2 },
  { id: "rules", slug: "rules", label: "Rules", icon: "shield", sort_order: 3 },
  { id: "commands", slug: "commands", label: "Commands", icon: "terminal", sort_order: 4 },
  { id: "markdown", slug: "markdown", label: "Markdown", icon: "file-text", sort_order: 5 },
  { id: "html", slug: "html", label: "HTML", icon: "code", sort_order: 6 },
];

export async function GET() {
  return NextResponse.json({ data: CATEGORY_VIEW });
}
