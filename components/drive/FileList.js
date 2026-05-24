"use client";

import { Folder } from "lucide-react";
import { isMediaFile } from "@/lib/fileType";
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
    <div className="overflow-visible rounded-xl border border-[#dadce0]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
          <tr>
            <th className="px-4 py-3 font-medium text-[#5f6368]">이름</th>
            <th className="hidden px-4 py-3 font-medium text-[#5f6368] sm:table-cell">
              유형
            </th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => (
            <tr
              key={folder.id}
              className="group cursor-pointer border-b border-[#dadce0] hover:bg-[#f8f9fa] active:bg-[#f1f3f4]"
              onClick={() => onFolderClick?.(folder.id)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#e8f0fe]">
                    <Folder className="h-4 w-4 text-[#1a73e8]" />
                  </div>
                  <span className="truncate font-medium text-[#3c4043]">
                    {folder.name}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-[#5f6368] sm:table-cell">
                폴더
              </td>
              <td className="px-4 py-3" />
            </tr>
          ))}
          {files.map((file) => {
            const canPreview = isMediaFile(file);

            return (
              <tr
                key={file.id}
                className={`group border-b border-[#dadce0] last:border-b-0 hover:bg-[#f8f9fa] ${
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
                    <span className="truncate text-[#3c4043]">{file.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-[#5f6368] sm:table-cell">
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
