import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";

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
      fields: "thumbnailLink,mimeType",
    });

    let imageUrl = file.thumbnailLink;

    if (!imageUrl) {
      imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }

    if (!imageUrl) {
      return new Response("No thumbnail available", { status: 404 });
    }

    const thumbRes = await fetch(imageUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!thumbRes.ok) {
      return new Response("Failed to fetch thumbnail", {
        status: thumbRes.status,
      });
    }

    const contentType = thumbRes.headers.get("content-type") || "image/jpeg";

    return new Response(thumbRes.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Drive thumbnail error:", error);
    return new Response(getDriveErrorMessage(error), {
      status: error?.code || 500,
    });
  }
}
