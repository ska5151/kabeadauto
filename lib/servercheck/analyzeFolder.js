import fs from "fs/promises";
import path from "path";
import { FOLDER_ROWS } from "./constants.js";
import { computeStatsFromContent, emptyRowStats } from "./stats.js";

async function readFolderJsonContent(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map((e) => e.name)
    .sort();

  const chunks = [];
  for (const name of jsonFiles) {
    const fullPath = path.join(dirPath, name);
    const content = await fs.readFile(fullPath, "utf-8");
    chunks.push(content);
  }
  return chunks.join("\n");
}

export async function analyzeFolders(folderPaths) {
  const rows = {};
  const errors = {};

  for (const key of FOLDER_ROWS) {
    const dirPath = folderPaths[key]?.trim();
    if (!dirPath) {
      rows[key] = emptyRowStats();
      errors[key] = "폴더 경로가 설정되지 않았습니다.";
      continue;
    }

    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        rows[key] = emptyRowStats();
        errors[key] = "경로가 폴더가 아닙니다.";
        continue;
      }

      const content = await readFolderJsonContent(dirPath);
      if (!content.trim()) {
        rows[key] = emptyRowStats();
        errors[key] = "분석할 JSON 파일이 없습니다.";
        continue;
      }

      const stats = computeStatsFromContent(content);
      const hasData = Object.values(stats).some((v) => v !== null);
      if (!hasData) {
        errors[key] = "데이터를 추출하지 못했습니다.";
      }
      rows[key] = stats;
    } catch (err) {
      rows[key] = emptyRowStats();
      errors[key] =
        err instanceof Error
          ? err.message
          : "폴더를 읽는 중 오류가 발생했습니다.";
    }
  }

  return { rows, errors };
}
