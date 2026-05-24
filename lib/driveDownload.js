export const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export const GOOGLE_EXPORT_TYPES = {
  "application/vnd.google-apps.document": {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: ".docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: ".xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: ".pptx",
  },
  "application/vnd.google-apps.drawing": {
    mimeType: "application/pdf",
    ext: ".pdf",
  },
  "application/vnd.google-apps.form": {
    mimeType: "application/pdf",
    ext: ".pdf",
  },
  "application/vnd.google-apps.site": {
    mimeType: "text/plain",
    ext: ".txt",
  },
};

export function buildDownloadFilename(name, mimeType) {
  const exportInfo = GOOGLE_EXPORT_TYPES[mimeType];
  if (!exportInfo) return name;

  const baseName = name.replace(/\.[^/.]+$/, "") || name;
  return `${baseName}${exportInfo.ext}`;
}

export function encodeContentDispositionFilename(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function sanitizeZipPathSegment(name) {
  const sanitized = String(name || "untitled")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized || sanitized === "." || sanitized === "..") return "untitled";
  return sanitized;
}

export async function downloadDriveFileContent({ accessToken, drive, file }) {
  const exportInfo = GOOGLE_EXPORT_TYPES[file.mimeType];
  const filename = buildDownloadFilename(file.name, file.mimeType);

  if (exportInfo) {
    const exportRes = await drive.files.export(
      {
        fileId: file.id,
        mimeType: exportInfo.mimeType,
      },
      { responseType: "arraybuffer" },
    );

    return {
      filename,
      contentType: exportInfo.mimeType,
      body: exportRes.data,
    };
  }

  const mediaUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;
  const mediaRes = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!mediaRes.ok) {
    throw new Error("Failed to download file");
  }

  return {
    filename,
    contentType:
      mediaRes.headers.get("content-type") ||
      file.mimeType ||
      "application/octet-stream",
    body: await mediaRes.arrayBuffer(),
  };
}
