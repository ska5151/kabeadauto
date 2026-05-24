"use client";

import { ChevronLeft, Folder } from "lucide-react";

export default function FolderNavBar({ folderName, onBack }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-2.5 sm:px-6 sm:py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800/80 active:bg-slate-700/80"
        aria-label="상위 폴더로 이동"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-400/20">
          <Folder className="h-4 w-4 text-sky-300" />
        </span>
        <h2 className="line-clamp-2 min-w-0 text-base font-semibold leading-snug tracking-tight text-slate-100">
          {folderName}
        </h2>
      </div>
    </div>
  );
}
