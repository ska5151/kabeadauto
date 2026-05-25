"use client";

import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

export default function FileGrid({
  folders = [],
  files,
  parentId,
  onFolderClick,
  onMediaClick,
  onItemCopied,
  onItemDeleted,
  onItemRenamed,
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          parentId={parentId}
          onClick={onFolderClick}
          onCopied={onItemCopied}
          onDeleted={onItemDeleted}
          onRenamed={onItemRenamed}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          parentId={parentId}
          onMediaClick={onMediaClick}
          onCopied={onItemCopied}
          onDeleted={onItemDeleted}
          onRenamed={onItemRenamed}
        />
      ))}
    </div>
  );
}
