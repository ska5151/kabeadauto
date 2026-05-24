import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage, listFiles } from "@/lib/drive";
import { mapDriveFile } from "@/lib/fileType";

export async function GET(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    const pageToken = searchParams.get("pageToken") || undefined;

    const drive = getDriveClient(accessToken);
    const data = await listFiles(drive, folderId, pageToken);

    return Response.json({
      files: (data.files || []).map(mapDriveFile),
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error("Drive files error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
