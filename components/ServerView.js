"use client";

import { useCallback, useEffect, useState } from "react";
import FolderConfig from "./servercheck/FolderConfig.js";
import StatsGrid from "./servercheck/StatsGrid.js";
import {
  applyDefaultPaths,
  loadFolderPaths,
  resolveInitialBasePath,
  saveBasePath,
  saveFolderPaths,
} from "../lib/servercheck/storage.js";

export default function ServerView() {
  const [paths, setPaths] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [basePath, setBasePath] = useState("D:\\project\\servercheck");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPaths = loadFolderPaths();
    setPaths(savedPaths);
    setBasePath(resolveInitialBasePath(savedPaths));
    setHydrated(true);
  }, []);

  const handlePathsChange = useCallback((next) => {
    setPaths(next);
    saveFolderPaths(next);
  }, []);

  const handleApplyDefaults = () => {
    const trimmedBase = basePath.trim();
    saveBasePath(trimmedBase);
    const next = applyDefaultPaths(trimmedBase || undefined);
    handlePathsChange(next);
  };

  const handleBasePathChange = (value) => {
    setBasePath(value);
    saveBasePath(value);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/servercheck/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderPaths: paths }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "분석에 실패했습니다.");
        return;
      }
      setResult(data);
    } catch {
      alert(
        "서버와 통신할 수 없습니다. npm run dev 로 로컬 실행 중인지 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="page-view page-view--servercheck">
        <div className="page-view__body">
          <p className="servercheck__status">로딩 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-view page-view--servercheck">
      <header className="page-view__header">
        <h1 className="page-view__title">IDC 점검</h1>
        <p className="servercheck__meta">
          15개 폴더 JSON Lines 로그 · Memory/CPU 통계 (전체 / 업무시간
          08:00~19:00)
        </p>
      </header>

      <div className="page-view__body">
        <div className="servercheck__toolbar">
          <div className="servercheck__toolbar-field">
            <label className="servercheck__toolbar-label" htmlFor="servercheck-base-path">
              기본 경로
            </label>
            <input
              id="servercheck-base-path"
              type="text"
              value={basePath}
              onChange={(e) => handleBasePathChange(e.target.value)}
              className="servercheck__input"
            />
          </div>
          <div className="servercheck__toolbar-actions">
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="servercheck__btn"
            >
              기본 경로 적용
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="servercheck__btn servercheck__btn--primary"
            >
              {loading ? "분석 중…" : "분석 실행"}
            </button>
          </div>
        </div>

        <FolderConfig paths={paths} onChange={handlePathsChange} />
        <StatsGrid result={result} loading={loading} />
      </div>
    </div>
  );
}
