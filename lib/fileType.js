export function getFileDisplayType(mimeType, name, hasThumbnail) {
  if (hasThumbnail) return "thumbnail";

  const lowerName = (name || "").toLowerCase();

  if (mimeType?.startsWith("application/vnd.google-apps.")) {
    if (mimeType.includes("spreadsheet")) return "xls";
    if (mimeType.includes("presentation")) return "ppt";
    if (mimeType.includes("document")) return "doc";
    if (mimeType.includes("form")) return "pdf";
    return "file";
  }

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    mimeType?.includes("spreadsheet") ||
    mimeType === "application/vnd.ms-excel" ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".csv")
  ) {
    return "xls";
  }
  if (
    mimeType?.includes("presentation") ||
    mimeType === "application/vnd.ms-powerpoint" ||
    lowerName.endsWith(".ppt") ||
    lowerName.endsWith(".pptx")
  ) {
    return "ppt";
  }
  if (
    mimeType?.includes("document") ||
    mimeType === "application/msword" ||
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx")
  ) {
    return "doc";
  }
  if (
    mimeType?.includes("zip") ||
    mimeType?.includes("compressed") ||
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".rar") ||
    lowerName.endsWith(".7z")
  ) {
    return "zip";
  }
  if (mimeType?.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType?.startsWith("text/") || lowerName.endsWith(".txt")) {
    return "txt";
  }
  if (mimeType?.startsWith("image/")) {
    return "image-yellow";
  }
  if (mimeType?.startsWith("video/")) {
    return "image-green";
  }

  return "file";
}

export function getFileTypeLabel(type) {
  const labels = {
    thumbnail: "미리보기",
    pdf: "PDF",
    doc: "문서",
    xls: "스프레드시트",
    ppt: "프레젠테이션",
    txt: "텍스트",
    zip: "압축",
    audio: "오디오",
    "image-yellow": "이미지",
    "image-green": "동영상",
    file: "파일",
    folder: "폴더",
    logo: "이미지",
    "pdf-yellow": "PDF",
  };

  return labels[type] || "파일";
}

export function isMediaFile(file) {
  return (
    file?.mimeType?.startsWith("image/") || file?.mimeType?.startsWith("video/")
  );
}

export function isPdfFile(file) {
  if (!file) return false;

  const lowerName = (file.name || "").toLowerCase();

  return (
    file.mimeType === "application/pdf" ||
    file.type === "pdf" ||
    file.type === "pdf-yellow" ||
    lowerName.endsWith(".pdf")
  );
}

export function isPreviewableFile(file) {
  return isMediaFile(file) || isPdfFile(file);
}

export function isVideoFile(file) {
  return file?.mimeType?.startsWith("video/");
}

export function getMediaUrl(fileId) {
  return `/api/drive/media?fileId=${encodeURIComponent(fileId)}`;
}

export function getDownloadUrl(fileId) {
  return `/api/drive/download?fileId=${encodeURIComponent(fileId)}`;
}

export function getFolderDownloadUrl(folderId) {
  return `/api/drive/folder-download?folderId=${encodeURIComponent(folderId)}`;
}

export async function downloadDriveFile(file) {
  const url =
    file.kind === "folder" || file.type === "folder"
      ? getFolderDownloadUrl(file.id)
      : getDownloadUrl(file.id);
  const response = await fetch(url);

  if (!response.ok) {
    let message = "다운로드에 실패했습니다.";
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  let filename = file.name;

  const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = disposition?.match(/filename="([^"]+)"/i);

  if (utf8Match?.[1]) {
    filename = decodeURIComponent(utf8Match[1]);
  } else if (asciiMatch?.[1]) {
    filename = asciiMatch[1];
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function mapDriveFile(file) {
  const hasThumbnail =
    Boolean(file.thumbnailLink) ||
    file.mimeType?.startsWith("image/") ||
    file.mimeType?.startsWith("video/");

  const displayType = getFileDisplayType(
    file.mimeType,
    file.name,
    hasThumbnail,
  );

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    thumbnailUrl: hasThumbnail
      ? `/api/drive/thumbnail?fileId=${encodeURIComponent(file.id)}`
      : null,
    type: displayType,
    typeLabel: getFileTypeLabel(displayType),
    webViewLink: file.webViewLink || null,
  };
}

export function mapDriveFolder(folder) {
  return {
    id: folder.id,
    name: folder.name,
    children: null,
  };
}

export function mapFolderForDisplay(folder) {
  return {
    id: folder.id,
    name: folder.name,
    kind: "folder",
    type: "folder",
    typeLabel: "폴더",
  };
}

export function isFolderItem(item) {
  return item?.kind === "folder";
}

export function updateFolderChildren(tree, folderId, children) {
  return tree.map((folder) => {
    if (folder.id === folderId) {
      return { ...folder, children };
    }
    if (Array.isArray(folder.children)) {
      return {
        ...folder,
        children: updateFolderChildren(folder.children, folderId, children),
      };
    }
    return folder;
  });
}

export function findFolder(tree, folderId) {
  for (const folder of tree) {
    if (folder.id === folderId) return folder;
    if (Array.isArray(folder.children)) {
      const found = findFolder(folder.children, folderId);
      if (found) return found;
    }
  }
  return null;
}

export function findParentFolder(tree, folderId, parent = null) {
  for (const folder of tree) {
    if (folder.id === folderId) {
      return parent;
    }
    if (Array.isArray(folder.children)) {
      const found = findParentFolder(folder.children, folderId, folder);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
