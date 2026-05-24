"use client";

import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

export default function FileGrid({
  folders = [],
  files,
  onFolderClick,
  onMediaClick,
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} onClick={onFolderClick} />
      ))}
      {files.map((file) => (
        <FileCard key={file.id} file={file} onMediaClick={onMediaClick} />
      ))}
    </div>
  );
}
