"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  Loader2,
  PanelLeftClose,
} from "lucide-react";
import DriveLogo from "./DriveLogo";

function FolderItem({
  folder,
  depth = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
  loadingFolderIds,
}) {
  const hasLoadedChildren = folder.children !== null;
  const hasChildren = hasLoadedChildren && folder.children.length > 0;
  const isUnloaded = folder.children === null;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedId === folder.id;
  const isLoading = loadingFolderIds.has(folder.id);
  const showChevron = hasChildren || isUnloaded;

  return (
    <div>
      <div
        className="flex items-stretch gap-0.5"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {showChevron ? (
          <button
            type="button"
            onClick={() => onToggle(folder.id)}
            className="flex h-11 w-10 shrink-0 self-center items-center justify-center rounded-lg text-[#5f6368] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed] md:h-9 md:w-8"
            aria-label={`${folder.name} ${isExpanded ? "접기" : "펼치기"}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-10 shrink-0 md:w-8" />
        )}
        <button
          type="button"
          onClick={() => onSelect(folder.id)}
          className={`flex min-h-11 flex-1 items-start gap-2 rounded-lg px-2 py-2.5 text-left text-sm transition-colors active:bg-[#e8eaed] md:min-h-9 md:py-2 ${
            isSelected
              ? "bg-[#e8f0fe] text-[#1a73e8]"
              : "text-[#3c4043] hover:bg-[#f1f3f4]"
          }`}
        >
          <Folder
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              isSelected ? "text-[#1a73e8]" : "text-[#5f6368]"
            }`}
          />
          <span className="line-clamp-2 min-w-0 flex-1 break-words leading-snug">
            {folder.name}
          </span>
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
              loadingFolderIds={loadingFolderIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  folders,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
  onRefresh,
  loadingFolderIds,
  collapsed,
  onToggleCollapse,
}) {
  return (
    <aside
      className={`flex min-h-0 flex-col border-r border-[#dadce0] bg-white transition-all duration-200 ease-out ${
        collapsed
          ? "hidden md:flex md:w-0 md:min-w-0 md:overflow-hidden md:border-r-0 md:p-0 md:opacity-0 md:pointer-events-none"
          : "flex h-full min-h-0 w-full shrink-0 p-4 md:h-auto md:w-[260px]"
      }`}
    >
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#3c4043] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]"
          aria-label="메뉴 접기"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
        <DriveLogo />
        <span className="truncate text-lg font-semibold text-[#202124]">
          Drive Manager
        </span>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] active:bg-[#f1f3f4] md:min-h-0"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        새로고침
      </button>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-2">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            selectedId={selectedId}
            onSelect={onSelect}
            expandedIds={expandedIds}
            onToggle={onToggle}
            loadingFolderIds={loadingFolderIds}
          />
        ))}
      </nav>
    </aside>
  );
}
