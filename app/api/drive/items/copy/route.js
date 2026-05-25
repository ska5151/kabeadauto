import { resolveAccessToken } from "@/lib/accessToken";
import { copyDriveItem, getDriveClient, getDriveErrorMessage } from "@/lib/drive";
import { mapDriveFile, mapDriveFolder } from "@/lib/fileType";

export async function POST(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const fileId = String(body.fileId || "").trim();
    const parentId = body.parentId || "root";

    if (!fileId || fileId === "root") {
      return Response.json(
        { error: "사본을 만들 파일 또는 폴더를 선택해 주세요." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    const item = await copyDriveItem(drive, fileId, parentId);
    const isFolder = item.mimeType === "application/vnd.google-apps.folder";

    return Response.json({
      item: isFolder ? mapDriveFolder(item) : mapDriveFile(item),
      kind: isFolder ? "folder" : "file",
    });
  } catch (error) {
    console.error("Drive item copy error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
