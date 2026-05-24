"use client";

import { Grid3X3, List } from "lucide-react";

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900/70">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
          view === "list"
            ? "bg-sky-500 text-white"
            : "text-slate-300 hover:bg-slate-800/80"
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
            ? "bg-sky-500 text-white"
            : "text-slate-300 hover:bg-slate-800/80"
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline">그리드</span>
      </button>
    </div>
  );
}
