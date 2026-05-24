import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";

const GOOGLE_EXPORT_TYPES = {
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

function buildDownloadFilename(name, mimeType) {
  const exportInfo = GOOGLE_EXPORT_TYPES[mimeType];
  if (!exportInfo) return name;

  const baseName = name.replace(/\.[^/.]+$/, "") || name;
  return `${baseName}${exportInfo.ext}`;
}

function encodeContentDispositionFilename(filename) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return new Response("fileId is required", { status: 400 });
    }

    const drive = getDriveClient(accessToken);
    const { data: file } = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "name,mimeType",
    });

    const exportInfo = GOOGLE_EXPORT_TYPES[file.mimeType];
    const downloadName = buildDownloadFilename(file.name, file.mimeType);

    let contentType = file.mimeType;
    let body;

    if (exportInfo) {
      const exportRes = await drive.files.export(
        {
          fileId,
          mimeType: exportInfo.mimeType,
        },
        { responseType: "arraybuffer" },
      );
      contentType = exportInfo.mimeType;
      body = exportRes.data;
    } else {
      const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
      const mediaRes = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!mediaRes.ok) {
        return new Response("Failed to download file", {
          status: mediaRes.status,
        });
      }

      contentType =
        mediaRes.headers.get("content-type") ||
        file.mimeType ||
        "application/octet-stream";
      body = await mediaRes.arrayBuffer();
    }

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": encodeContentDispositionFilename(downloadName),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Drive download error:", error);
    return new Response(getDriveErrorMessage(error), {
      status: error?.code || 500,
    });
  }
}
