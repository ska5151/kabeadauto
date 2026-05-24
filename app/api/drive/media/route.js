import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";
import { downloadDriveFileContent } from "@/lib/driveDownload";

const GOOGLE_PDF_PREVIEW_TYPES = new Set([
  "application/vnd.google-apps.form",
  "application/vnd.google-apps.drawing",
]);

function isPreviewMimeType(mimeType, name) {
  if (mimeType?.startsWith("image/") || mimeType?.startsWith("video/")) {
    return true;
  }
  if (mimeType === "application/pdf") return true;
  if (GOOGLE_PDF_PREVIEW_TYPES.has(mimeType)) return true;
  return (name || "").toLowerCase().endsWith(".pdf");
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

    if (!isPreviewMimeType(file.mimeType, file.name)) {
      return new Response("Not a previewable file", { status: 400 });
    }

    const isPdfPreview =
      file.mimeType === "application/pdf" ||
      GOOGLE_PDF_PREVIEW_TYPES.has(file.mimeType) ||
      (file.name || "").toLowerCase().endsWith(".pdf");

    if (isPdfPreview) {
      const { contentType, body } = await downloadDriveFileContent({
        accessToken,
        drive,
        file: { ...file, id: fileId },
      });

      return new Response(body, {
        headers: {
          "Content-Type": contentType.includes("pdf")
            ? contentType
            : "application/pdf",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
    const rangeHeader = request.headers.get("range");
    const fetchHeaders = { Authorization: `Bearer ${accessToken}` };

    if (rangeHeader) {
      fetchHeaders.Range = rangeHeader;
    }

    const mediaRes = await fetch(mediaUrl, { headers: fetchHeaders });

    if (!mediaRes.ok && mediaRes.status !== 206) {
      return new Response("Failed to fetch media", {
        status: mediaRes.status,
      });
    }

    const responseHeaders = {
      "Content-Type": file.mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    };

    const contentRange = mediaRes.headers.get("content-range");
    const contentLength = mediaRes.headers.get("content-length");

    if (contentRange) responseHeaders["Content-Range"] = contentRange;
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    return new Response(mediaRes.body, {
      status: mediaRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Drive media error:", error);
    return new Response(getDriveErrorMessage(error), {
      status: error?.code || 500,
    });
  }
}
