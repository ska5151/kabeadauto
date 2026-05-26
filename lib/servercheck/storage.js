import {
  DEFAULT_BASE_PATH,
  FOLDER_ROWS,
  STORAGE_KEY,
  STORAGE_KEY_BASE_PATH,
} from "./constants.js";

export function loadFolderPaths() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function saveFolderPaths(paths) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
}

export function loadBasePath() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BASE_PATH);
    if (saved?.trim()) return saved.trim();
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveInitialBasePath(folderPaths) {
  const saved = loadBasePath();
  if (saved) return saved;
  const inferred = inferBasePathFromFolderPaths(folderPaths);
  if (inferred) return inferred;
  return DEFAULT_BASE_PATH;
}

export function saveBasePath(basePath) {
  if (typeof window === "undefined") return;
  const trimmed = basePath?.trim();
  if (!trimmed) {
    localStorage.removeItem(STORAGE_KEY_BASE_PATH);
    return;
  }
  localStorage.setItem(STORAGE_KEY_BASE_PATH, trimmed);
}

/** 저장된 폴더 경로에서 공통 기본 경로 추정 (기본 경로 미저장 시) */
export function inferBasePathFromFolderPaths(paths) {
  for (const key of FOLDER_ROWS) {
    const dirPath = paths[key]?.trim();
    if (!dirPath) continue;
    const suffix = `\\${key}`;
    if (dirPath.toLowerCase().endsWith(suffix.toLowerCase())) {
      return dirPath.slice(0, -suffix.length);
    }
  }
  return null;
}

export function applyDefaultPaths(basePath = DEFAULT_BASE_PATH) {
  const paths = {};
  for (const key of FOLDER_ROWS) {
    paths[key] = `${basePath}\\${key}`;
  }
  return paths;
}

export function isFolderKey(key) {
  return FOLDER_ROWS.includes(key);
}
