"use client";

import { Folder } from "lucide-react";
import FileMenu from "./FileMenu";

export default function FolderCard({
  folder,
  parentId,
  onClick,
  onCopied,
  onDeleted,
  onRenamed,
  draggingItemId,
  dropTargetFolderId,
  onItemDragStart,
  onItemDragEnd,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}) {
  const isDragging = draggingItemId === folder.id;
  const isDropTarget = dropTargetFolderId === folder.id;

  return (
    <div
      draggable
      onDragStart={onItemDragStart?.(folder, parentId)}
      onDragEnd={onItemDragEnd}
      onDragOver={onFolderDragOver?.(folder.id)}
      onDragLeave={onFolderDragLeave?.(folder.id)}
      onDrop={onFolderDrop?.(folder.id)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-slate-900/65 text-left transition-all hover:bg-slate-900/90 hover:shadow-lg hover:shadow-sky-950/20 ${
        isDropTarget
          ? "border-sky-400 ring-2 ring-sky-400/60"
          : "border-slate-700/70 hover:border-sky-400/40"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={() => onClick?.(folder.id)}
        className="text-left active:bg-slate-800/90"
      >
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-sky-500/10">
          <Folder className="h-14 w-14 text-sky-300 transition-transform group-hover:scale-105" />
        </div>
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="truncate text-sm font-medium text-slate-100">
          {folder.name}
        </p>
        <FileMenu
          file={folder}
          parentId={parentId}
          onCopied={onCopied}
          onDeleted={onDeleted}
          onRenamed={onRenamed}
        />
      </div>
    </div>
  );
}
