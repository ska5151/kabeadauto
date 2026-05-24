"use client";

import { isMediaFile } from "@/lib/fileType";
import FileMenu from "./FileMenu";
import FileTypeIcon from "./FileTypeIcon";

export default function FileCard({ file, onMediaClick }) {
  const canPreview = isMediaFile(file);

  return (
    <div className="group flex flex-col rounded-xl border border-[#dadce0] bg-white transition-shadow hover:shadow-md">
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
        <p className="truncate text-sm text-[#3c4043]">{file.name}</p>
        <FileMenu file={file} />
      </div>
    </div>
  );
}
