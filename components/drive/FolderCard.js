"use client";

import { Folder } from "lucide-react";

export default function FolderCard({ folder, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(folder.id)}
      className="group flex flex-col rounded-xl border border-[#dadce0] bg-white text-left transition-shadow hover:shadow-md active:bg-[#f8f9fa]"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#e8f0fe]">
        <Folder className="h-14 w-14 text-[#1a73e8] transition-transform group-hover:scale-105" />
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium text-[#3c4043]">
          {folder.name}
        </p>
      </div>
    </button>
  );
}
