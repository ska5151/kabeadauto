import { resolveAccessToken } from "@/lib/accessToken";
import {
  getDriveClient,
  getDriveErrorMessage,
  listFolders,
} from "@/lib/drive";
import { mapDriveFolder } from "@/lib/fileType";

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

    const drive = getDriveClient(accessToken);
    const folders = await listFolders(drive, folderId);

    return Response.json({
      folders: folders.map(mapDriveFolder),
    });
  } catch (error) {
    console.error("Drive folders error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
