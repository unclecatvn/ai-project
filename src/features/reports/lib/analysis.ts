import manifestData from "@/data/analysis-manifest.json";

export type AnalysisItem = {
  id: string;
  title: string;
  sourcePath: string;
  fileName: string;
  type: "markdown" | "html";
  publicPath: string;
  size: number;
};

const manifest = manifestData as AnalysisItem[];

export function getAllAnalysisItems() {
  return manifest;
}

export function getAnalysisItemById(id: string) {
  return manifest.find((item) => item.id === id) ?? null;
}
