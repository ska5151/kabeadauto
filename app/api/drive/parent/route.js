import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage } from "@/lib/drive";

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
    const folderId = searchParams.get("folderId");

    if (!folderId || folderId === "root") {
      return Response.json({ parentId: null, parentName: null });
    }

    const drive = getDriveClient(accessToken);
    const { data: folder } = await drive.files.get({
      fileId: folderId,
      supportsAllDrives: true,
      fields: "parents",
    });

    const parentId = folder.parents?.[0] || null;

    if (!parentId) {
      return Response.json({ parentId: "root", parentName: "My Drive" });
    }

    const { data: parent } = await drive.files.get({
      fileId: parentId,
      supportsAllDrives: true,
      fields: "name",
    });

    return Response.json({
      parentId,
      parentName: parent.name || "상위 폴더",
    });
  } catch (error) {
    console.error("Drive parent error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
