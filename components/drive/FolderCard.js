"use client";

import { Folder } from "lucide-react";
import FileMenu from "./FileMenu";

export default function FolderCard({ folder, onClick }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/65 text-left transition-all hover:border-sky-400/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-sky-950/20">
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
        <FileMenu file={folder} />
      </div>
    </div>
  );
}
