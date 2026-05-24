"use client";

import { Grid3X3, List } from "lucide-react";

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-[#dadce0]">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
          view === "list"
            ? "bg-[#1a73e8] text-white"
            : "bg-white text-[#3c4043] hover:bg-[#f8f9fa]"
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">리스트</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange("grid")}
        className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
          view === "grid"
            ? "bg-[#1a73e8] text-white"
            : "bg-white text-[#3c4043] hover:bg-[#f8f9fa]"
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline">그리드</span>
      </button>
    </div>
  );
}
