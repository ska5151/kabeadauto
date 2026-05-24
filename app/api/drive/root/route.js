import { resolveAccessToken } from "@/lib/accessToken";
import {
  getDriveClient,
  getDriveErrorMessage,
  resolveFolderPath,
} from "@/lib/drive";

export async function GET() {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const folderPath = process.env.ROOT_FOLDER_ID;

    if (!folderPath || folderPath === "root") {
      return Response.json({ folderId: "root" });
    }

    const drive = getDriveClient(accessToken);

    try {
      const folderId = await resolveFolderPath(drive, folderPath);
      return Response.json({ folderId, folderPath });
    } catch (pathError) {
      console.warn("Root folder path fallback:", pathError.message);
      return Response.json({
        folderId: "root",
        folderPath,
        warning: pathError.message,
      });
    }
  } catch (error) {
    console.error("Root folder resolve error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
