"use client";

import { ChevronLeft, Folder } from "lucide-react";

export default function FolderNavBar({ folderName, onBack }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-2.5 sm:px-6 sm:py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]"
        aria-label="상위 폴더로 이동"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe]">
          <Folder className="h-4 w-4 text-[#1a73e8]" />
        </span>
        <h2 className="line-clamp-2 min-w-0 text-base font-semibold leading-snug tracking-tight text-[#202124]">
          {folderName}
        </h2>
      </div>
    </div>
  );
}
