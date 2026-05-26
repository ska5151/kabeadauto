import { resolveAccessToken } from "@/lib/accessToken";
import {
  getDriveClient,
  getDriveErrorMessage,
  moveDriveItem,
} from "@/lib/drive";
import { mapDriveFile } from "@/lib/fileType";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export async function PUT(request) {
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
    const parentId = String(body.parentId || "root").trim() || "root";
    const sourceParentId =
      String(body.sourceParentId || "root").trim() || "root";

    if (!fileId || fileId === "root") {
      return Response.json(
        { error: "이동할 파일 또는 폴더를 선택해 주세요." },
        { status: 400 },
      );
    }

    if (fileId === parentId) {
      return Response.json(
        { error: "같은 폴더로는 이동할 수 없습니다." },
        { status: 400 },
      );
    }

    if (parentId === sourceParentId) {
      return Response.json(
        { error: "이미 해당 폴더에 있습니다." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    const item = await moveDriveItem(drive, fileId, parentId, sourceParentId);
    const isFolder = item.mimeType === FOLDER_MIME_TYPE;

    return Response.json({
      item: isFolder ? { id: item.id, name: item.name } : mapDriveFile(item),
      kind: isFolder ? "folder" : "file",
      fromParentId: sourceParentId,
      toParentId: parentId,
    });
  } catch (error) {
    console.error("Drive item move error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
