"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import DriveLogo from "./DriveLogo";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import FolderNavBar from "./FolderNavBar";
import LoadingFooter from "./LoadingFooter";
import LoginScreen from "./LoginScreen";
import MediaPreviewModal from "./MediaPreviewModal";
import Sidebar from "./Sidebar";
import ViewToggle from "./ViewToggle";
import {
  findFolder,
  findParentFolder,
  mapFolderForDisplay,
  updateFolderChildren,
} from "@/lib/fileType";

const ROOT_FOLDER = { id: "root", name: "My Drive", children: null };

function isInsufficientScopeError(message) {
  return /insufficient authentication scopes/i.test(message || "");
}

async function reauthForDriveScope() {
  await signOut({ redirect: false });
  window.location.href = "/";
}

async function fetchJson(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "요청에 실패했습니다.");
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 네트워크 연결을 확인해 주세요.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function DriveManager() {
  const { data: session, status } = useSession();
  const [serverAuth, setServerAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState("grid");
  const [folderTree, setFolderTree] = useState([ROOT_FOLDER]);
  const [selectedFolderId, setSelectedFolderId] = useState("root");
  const [expandedIds, setExpandedIds] = useState(new Set(["root"]));
  const [loadingFolderIds, setLoadingFolderIds] = useState(new Set());
  const [files, setFiles] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [initialFolderReady, setInitialFolderReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const [folderHistory, setFolderHistory] = useState([]);
  const scrollContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const nextPageTokenRef = useRef(null);
  const selectedFolderIdRef = useRef("root");
  const folderHistoryRef = useRef([]);
  const isLoadingFilesRef = useRef(false);
  const initializedRef = useRef(false);

  const isAuthenticated = serverAuth || status === "authenticated";

  useEffect(() => {
    nextPageTokenRef.current = nextPageToken;
  }, [nextPageToken]);

  useEffect(() => {
    selectedFolderIdRef.current = selectedFolderId;
  }, [selectedFolderId]);

  useEffect(() => {
    isLoadingFilesRef.current = isLoadingFiles;
  }, [isLoadingFiles]);

  useEffect(() => {
    if (serverAuth || status !== "loading") {
      setSessionTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => setSessionTimedOut(true), 10000);
    return () => clearTimeout(timeoutId);
  }, [serverAuth, status]);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setServerAuth(Boolean(data.serverAuth));
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadFolderChildren = useCallback(async (folderId) => {
    setLoadingFolderIds((prev) => new Set(prev).add(folderId));

    try {
      const res = await fetch(`/api/drive/folders?folderId=${folderId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "폴더를 불러오지 못했습니다.");
      }

      const folders = (data.folders || []).map(mapFolderForDisplay);

      setFolderTree((prev) =>
        updateFolderChildren(prev, folderId, data.folders),
      );

      if (folderId === selectedFolderIdRef.current) {
        setSubfolders(folders);
      }

      return folders;
    } catch (err) {
      if (isInsufficientScopeError(err.message)) {
        await reauthForDriveScope();
        return [];
      }
      setError(err.message);
      return [];
    } finally {
      setLoadingFolderIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  }, []);

  const loadFiles = useCallback(async (folderId, pageToken, append = false) => {
    if (append) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
    } else {
      setIsLoadingFiles(true);
      setError(null);
    }

    try {
      const params = new URLSearchParams({ folderId });
      if (pageToken) params.set("pageToken", pageToken);

      const data = await fetchJson(`/api/drive/files?${params}`);

      if (append && (!data.files || data.files.length === 0)) {
        nextPageTokenRef.current = null;
        setNextPageToken(null);
      } else {
        nextPageTokenRef.current = data.nextPageToken || null;
        setNextPageToken(data.nextPageToken || null);
      }

      setFiles((prev) => (append ? [...prev, ...data.files] : data.files));
    } catch (err) {
      if (isInsufficientScopeError(err.message)) {
        await reauthForDriveScope();
        return;
      }
      setError(err.message);
    } finally {
      if (append) {
        loadingMoreRef.current = false;
      }
      setIsLoadingFiles(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAuthenticated) {
      initializedRef.current = false;
      setInitialFolderReady(false);
      return;
    }

    if (
      !serverAuth &&
      (session?.error === "RefreshAccessTokenError" ||
        session?.error === "InsufficientScopeError" ||
        session?.hasDriveScope === false)
    ) {
      signOut({ callbackUrl: "/" });
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function initDrive() {
      try {
        const rootData = await fetchJson("/api/drive/root").catch(() => ({
          folderId: "root",
        }));

        if (rootData.warning && !cancelled) {
          setError(`${rootData.warning} (My Drive에서 시작합니다)`);
        }

        const startFolderId = rootData.folderId || "root";

        if (cancelled) return;

        setSelectedFolderId(startFolderId);
        selectedFolderIdRef.current = startFolderId;
        setExpandedIds(new Set(["root"]));
        await loadFolderChildren("root");
        if (startFolderId !== "root") {
          await loadFolderChildren(startFolderId);
        }
        await loadFiles(startFolderId);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setInitialFolderReady(true);
      }
    }

    initDrive();

    return () => {
      cancelled = true;
    };
  }, [
    authChecked,
    isAuthenticated,
    serverAuth,
    session?.error,
    session?.hasDriveScope,
    loadFolderChildren,
    loadFiles,
  ]);

  const tryLoadMore = useCallback(() => {
    const token = nextPageTokenRef.current;
    const folderId = selectedFolderIdRef.current;
    if (!token || loadingMoreRef.current || isLoadingFilesRef.current) return;
    loadFiles(folderId, token, true);
  }, [loadFiles]);

  const updateLoadMoreUi = useCallback(() => {
    const root = scrollContainerRef.current;
    if (!root || !nextPageTokenRef.current) {
      setShowLoadMoreButton(false);
      return;
    }

    setShowLoadMoreButton(root.scrollHeight <= root.clientHeight + 24);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !nextPageToken) return;

    const root = scrollContainerRef.current;
    if (!root) return;

    updateLoadMoreUi();

    const handleScroll = () => {
      if (
        !nextPageTokenRef.current ||
        loadingMoreRef.current ||
        isLoadingFilesRef.current
      ) {
        return;
      }

      if (root.scrollHeight <= root.clientHeight + 24) return;

      const distanceFromBottom =
        root.scrollHeight - root.scrollTop - root.clientHeight;

      if (distanceFromBottom < 200) {
        tryLoadMore();
      }
    };

    const resizeObserver = new ResizeObserver(updateLoadMoreUi);
    resizeObserver.observe(root);
    root.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      root.removeEventListener("scroll", handleScroll);
    };
  }, [
    isAuthenticated,
    nextPageToken,
    tryLoadMore,
    updateLoadMoreUi,
    files.length,
    view,
  ]);

  const handleToggle = useCallback(
    async (folderId) => {
      const isExpanding = !expandedIds.has(folderId);

      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        return next;
      });

      if (isExpanding) {
        const folder = findFolder(folderTree, folderId);
        if (folder && folder.children === null) {
          await loadFolderChildren(folderId);
        }
      }
    },
    [expandedIds, folderTree, loadFolderChildren],
  );

  const handleSelectFolder = useCallback(
    (folderId, { recordHistory = false, resetHistory = false } = {}) => {
      if (resetHistory) {
        folderHistoryRef.current = [];
        setFolderHistory([]);
      } else if (recordHistory && folderId !== selectedFolderIdRef.current) {
        const currentFolder = findFolder(folderTree, selectedFolderIdRef.current);
        const historyEntry = {
          id: selectedFolderIdRef.current,
          name: currentFolder?.name || ROOT_FOLDER.name,
        };
        folderHistoryRef.current = [...folderHistoryRef.current, historyEntry];
        setFolderHistory(folderHistoryRef.current);
      }

      selectedFolderIdRef.current = folderId;
      setSelectedFolderId(folderId);
      setFiles([]);
      setSubfolders([]);
      nextPageTokenRef.current = null;
      setNextPageToken(null);
      setShowLoadMoreButton(false);
      setSidebarCollapsed(true);
      setExpandedIds((prev) => new Set(prev).add(folderId));

      const folder = findFolder(folderTree, folderId);
      if (folder?.children) {
        setSubfolders(folder.children.map(mapFolderForDisplay));
      }

      loadFolderChildren(folderId);
      loadFiles(folderId);
    },
    [loadFiles, loadFolderChildren, folderTree],
  );

  const handleOpenFolder = useCallback(
    (folderId) => {
      handleSelectFolder(folderId, { recordHistory: true });
    },
    [handleSelectFolder],
  );

  const handleSidebarSelectFolder = useCallback(
    (folderId) => {
      handleSelectFolder(folderId, { resetHistory: true });
    },
    [handleSelectFolder],
  );

  const handleBack = useCallback(async () => {
    const history = folderHistoryRef.current;

    if (history.length > 0) {
      const target = history[history.length - 1];
      folderHistoryRef.current = history.slice(0, -1);
      setFolderHistory(folderHistoryRef.current);
      handleSelectFolder(target.id);
      return;
    }

    const parentInTree = findParentFolder(folderTree, selectedFolderIdRef.current);
    if (parentInTree !== undefined) {
      if (parentInTree === null) {
        handleSelectFolder("root");
      } else {
        handleSelectFolder(parentInTree.id);
      }
      return;
    }

    if (selectedFolderIdRef.current === "root") return;

    try {
      const data = await fetchJson(
        `/api/drive/parent?folderId=${encodeURIComponent(selectedFolderIdRef.current)}`,
      );
      if (data.parentId) {
        handleSelectFolder(data.parentId);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [folderTree, handleSelectFolder]);

  const selectedFolder = findFolder(folderTree, selectedFolderId);
  const currentFolderName = selectedFolder?.name || ROOT_FOLDER.name;
  const canGoBack = folderHistory.length > 0 || selectedFolderId !== "root";

  const handleRefresh = useCallback(() => {
    setFiles([]);
    setSubfolders([]);
    nextPageTokenRef.current = null;
    setNextPageToken(null);
    setShowLoadMoreButton(false);
    loadFiles(selectedFolderId);
    loadFolderChildren(selectedFolderId);
  }, [selectedFolderId, loadFiles, loadFolderChildren]);

  const isAppLoading =
    !authChecked ||
    (isAuthenticated && !initialFolderReady) ||
    (!serverAuth && status === "loading" && !sessionTimedOut);

  if (isAppLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#f8f9fa]">
        <LoadingFooter message="파일을 불러오는 중..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-full min-h-0 bg-[#f8f9fa] sm:min-h-full sm:items-center sm:justify-center sm:p-4 md:p-6">
      <div className="relative flex h-full min-h-0 w-full max-w-6xl overflow-hidden bg-white sm:h-[calc(100%-32px)] sm:rounded-2xl sm:border sm:border-[#dadce0] sm:shadow-sm md:h-[calc(100%-48px)]">
        <Sidebar
          folders={folderTree}
          selectedId={selectedFolderId}
          onSelect={handleSidebarSelectFolder}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          onRefresh={handleRefresh}
          loadingFolderIds={loadingFolderIds}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(true)}
        />

        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
            sidebarCollapsed ? "flex" : "hidden md:flex"
          }`}
        >
          <header className="flex items-center justify-between gap-2 border-b border-[#dadce0] px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#3c4043] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]"
                aria-label={sidebarCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              <DriveLogo />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-[#202124] sm:text-xl">
                  Drive Manager
                </h1>
                {serverAuth ? (
                  <p className="hidden text-xs text-[#5f6368] sm:block">
                    서버 인증 (로그인 불필요)
                  </p>
                ) : (
                  session?.user?.email && (
                    <p className="hidden truncate text-xs text-[#5f6368] sm:block">
                      {session.user.email}
                    </p>
                  )
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ViewToggle view={view} onViewChange={setView} />
              {!serverAuth && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-[#dadce0] px-2 py-2 text-sm text-[#3c4043] hover:bg-[#f8f9fa] sm:px-3"
                >
                  <span className="hidden sm:inline">로그아웃</span>
                  <span className="sm:hidden">나가기</span>
                </button>
              )}
            </div>
          </header>

          {canGoBack && (
            <div className="border-b border-[#e8eaed] bg-[#fafbfc]">
              <FolderNavBar folderName={currentFolderName} onBack={handleBack} />
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 sm:pb-5"
          >
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoadingFiles && files.length === 0 && subfolders.length === 0 ? (
              <LoadingFooter message="파일을 불러오는 중..." />
            ) : files.length === 0 && subfolders.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#5f6368]">
                이 폴더가 비어 있습니다.
              </p>
            ) : view === "grid" ? (
              <FileGrid
                folders={subfolders}
                files={files}
                onFolderClick={handleOpenFolder}
                onMediaClick={setPreviewFile}
              />
            ) : (
              <FileList
                folders={subfolders}
                files={files}
                onFolderClick={handleOpenFolder}
                onMediaClick={setPreviewFile}
              />
            )}

            {nextPageToken && (
              <div className="py-4">
                {isLoadingMore ? (
                  <LoadingFooter />
                ) : showLoadMoreButton ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={tryLoadMore}
                      className="rounded-lg border border-[#dadce0] bg-white px-5 py-2.5 text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] active:bg-[#f1f3f4]"
                    >
                      더 불러오기
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </main>
      </div>

      <MediaPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
