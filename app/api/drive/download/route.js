import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";
import {
  downloadDriveFileContent,
  encodeContentDispositionFilename,
} from "@/lib/driveDownload";

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

    const { filename, contentType, body } = await downloadDriveFileContent({
      accessToken,
      drive,
      file: { ...file, id: fileId },
    });

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": encodeContentDispositionFilename(filename),
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
