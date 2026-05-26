"use client";

import { isGoogleWorkspaceFile, isPreviewableFile } from "@/lib/fileType";
import FileMenu from "./FileMenu";
import FileTypeIcon from "./FileTypeIcon";

export default function FileCard({
  file,
  parentId,
  onMediaClick,
  onCopied,
  onDeleted,
  onRenamed,
  draggingItemId,
  onItemDragStart,
  onItemDragEnd,
}) {
  const canPreview = isPreviewableFile(file);
  const canOpenInGoogle = isGoogleWorkspaceFile(file) && file.webViewLink;
  const canOpen = canPreview || canOpenInGoogle;
  const isDragging = draggingItemId === file.id;

  const handleOpen = () => {
    if (canOpenInGoogle) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
      return;
    }

    if (canPreview) {
      onMediaClick?.(file);
    }
  };

  return (
    <div
      draggable
      onDragStart={onItemDragStart?.(file, parentId)}
      onDragEnd={onItemDragEnd}
      className={`group flex flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/65 transition-all hover:border-sky-400/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-sky-950/20 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleOpen}
        disabled={!canOpen}
        className={`aspect-[4/3] w-full overflow-hidden text-left ${
          canOpen
            ? "cursor-pointer transition-opacity hover:opacity-95 active:opacity-90"
            : "cursor-default"
        }`}
        aria-label={canOpen ? `${file.name} 열기` : undefined}
      >
        <FileTypeIcon type={file.type} thumbnailUrl={file.thumbnailUrl} />
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="truncate text-sm text-slate-200">{file.name}</p>
        <FileMenu
          file={file}
          parentId={parentId}
          onCopied={onCopied}
          onDeleted={onDeleted}
          onRenamed={onRenamed}
        />
      </div>
    </div>
  );
}
