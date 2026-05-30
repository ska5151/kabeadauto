import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const IDC_MARKER = "# idc database";

function readEnvFiles() {
  const cwd = process.cwd();
  return [path.join(cwd, ".env.local"), path.join(cwd, ".env")]
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => {
      try {
        return readFileSync(filePath, "utf8");
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function extractJsonAfterMarker(text) {
  const markerIndex = text.indexOf(IDC_MARKER);
  if (markerIndex === -1) return null;

  const after = text.slice(markerIndex + IDC_MARKER.length);
  const firstBrace = after.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  for (let i = firstBrace; i < after.length; i++) {
    const ch = after[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) {
      return after.slice(firstBrace, i + 1);
    }
  }

  return null;
}

function normalizeIdcConfig(key, value) {
  if (!key || typeof key !== "string") return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const host = typeof value.host === "string" ? value.host.trim() : "";
  const user = typeof value.user === "string" ? value.user.trim() : "";
  const password = typeof value.password === "string" ? value.password : "";
  const database = typeof value.database === "string" ? value.database.trim() : "";
  const port = Number(value.port || 3306);

  if (!host || !user || !database) return null;

  return {
    key: key.trim(),
    config: {
      host,
      port: Number.isFinite(port) ? port : 3306,
      user,
      password,
      database,
    },
  };
}

export function listIdcDbConfigs() {
  for (const text of readEnvFiles()) {
    const json = extractJsonAfterMarker(text);
    if (!json) continue;

    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        continue;
      }

      const configs = Object.entries(parsed)
        .map(([key, value]) => normalizeIdcConfig(key, value))
        .filter(Boolean);

      if (configs.length > 0) return configs;
    } catch {
      continue;
    }
  }

  return [];
}
