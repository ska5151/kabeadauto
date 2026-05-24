"use client";

import { Folder } from "lucide-react";
import { isPreviewableFile } from "@/lib/fileType";
import FileMenu from "./FileMenu";
import FileTypeIcon from "./FileTypeIcon";

export default function FileList({
  folders = [],
  files,
  onFolderClick,
  onMediaClick,
}) {
  const hasItems = folders.length > 0 || files.length > 0;

  if (!hasItems) return null;

  return (
    <div className="overflow-visible rounded-xl border border-slate-700/70 bg-slate-900/55">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-700/70 bg-slate-950/50">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-400">이름</th>
            <th className="hidden px-4 py-3 font-medium text-slate-400 sm:table-cell">
              유형
            </th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => (
            <tr
              key={folder.id}
              className="group cursor-pointer border-b border-slate-700/70 hover:bg-slate-800/60 active:bg-slate-700/70"
              onClick={() => onFolderClick?.(folder.id)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sky-500/15 ring-1 ring-sky-400/20">
                    <Folder className="h-4 w-4 text-sky-300" />
                  </div>
                  <span className="truncate font-medium text-slate-100">
                    {folder.name}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">
                폴더
              </td>
              <td className="px-4 py-3">
                <FileMenu file={folder} />
              </td>
            </tr>
          ))}
          {files.map((file) => {
            const canPreview = isPreviewableFile(file);

            return (
              <tr
                key={file.id}
                className={`group border-b border-slate-700/70 last:border-b-0 hover:bg-slate-800/60 ${
                  canPreview ? "cursor-pointer" : ""
                }`}
                onClick={() => canPreview && onMediaClick?.(file)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
                      <FileTypeIcon
                        type={file.type}
                        thumbnailUrl={file.thumbnailUrl}
                      />
                    </div>
                    <span className="truncate text-slate-200">{file.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">
                  {file.typeLabel || file.type}
                </td>
                <td className="px-4 py-3">
                  <FileMenu file={file} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
