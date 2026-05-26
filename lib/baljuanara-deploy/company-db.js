import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * @returns {Record<string, string>} 업체 키 → DB 관리 웹 URL
 *
 * `.env` 파일의 `# baljuanara company db` 섹션을 직접 파싱합니다.
 * - 형식 A: 데모=http://... 처럼 key=value 라인들
 * - 형식 B: { "데모": "http://...", "동심사": "http://..." } 처럼 JSON 객체
 */
export function loadCompanyDbJson() {
  const cwd = process.cwd();
  const envLocalPath = path.join(cwd, ".env.local");
  const envPath = path.join(cwd, ".env");
  const readPath = existsSync(envLocalPath) ? envLocalPath : envPath;

  if (!existsSync(readPath)) return {};

  let text = "";
  try {
    text = readFileSync(readPath, "utf8");
  } catch {
    return {};
  }

  const marker = "# baljuanara company db";
  const idx = text.indexOf(marker);
  if (idx === -1) return {};

  const after = text.slice(idx + marker.length);
  const lines = after.split(/\r?\n/);
  const joined = lines.join("\n");

  // 1) JSON 객체 포맷 시도
  const firstBrace = joined.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < joined.length; i++) {
      const ch = joined[i];
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    if (end !== -1) {
      const jsonCandidate = joined.slice(firstBrace, end + 1);
      try {
        const obj = JSON.parse(jsonCandidate);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          const out = {};
          for (const [k, v] of Object.entries(obj)) {
            if (!k || typeof k !== "string") continue;
            if (typeof v !== "string") continue;
            const s = v.trim();
            if (!s) continue;
            if (!(s.startsWith("http://") || s.startsWith("https://"))) continue;
            out[k.trim()] = s;
          }
          if (Object.keys(out).length > 0) return out;
        }
      } catch {
        // JSON 파싱 실패 시 key=value 라인 파싱으로 fallback
      }
    }
  }

  // 2) key=value 라인 포맷 파싱
  const out = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) break;
    if (line.startsWith("{") || line.startsWith("}")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!key || !value) continue;
    if (!(value.startsWith("http://") || value.startsWith("https://"))) continue;
    out[key] = value;
  }
  return out;
}
