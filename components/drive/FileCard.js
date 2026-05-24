"use client";

import { isPreviewableFile } from "@/lib/fileType";
import FileMenu from "./FileMenu";
import FileTypeIcon from "./FileTypeIcon";

export default function FileCard({ file, onMediaClick }) {
  const canPreview = isPreviewableFile(file);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/65 transition-all hover:border-sky-400/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-sky-950/20">
      <button
        type="button"
        onClick={() => canPreview && onMediaClick?.(file)}
        disabled={!canPreview}
        className={`aspect-[4/3] w-full overflow-hidden text-left ${
          canPreview
            ? "cursor-pointer transition-opacity hover:opacity-95 active:opacity-90"
            : "cursor-default"
        }`}
        aria-label={canPreview ? `${file.name} 미리보기` : undefined}
      >
        <FileTypeIcon type={file.type} thumbnailUrl={file.thumbnailUrl} />
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="truncate text-sm text-slate-200">{file.name}</p>
        <FileMenu file={file} />
      </div>
    </div>
  );
}
