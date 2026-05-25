import { resolveAccessToken } from "@/lib/accessToken";
import { getDriveClient, getDriveErrorMessage, uploadDriveFile } from "@/lib/drive";
import { mapDriveFile } from "@/lib/fileType";

export async function POST(request) {
  try {
    const accessToken = await resolveAccessToken();

    if (!accessToken) {
      return Response.json(
        { error: "인증 토큰이 없습니다. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const parentId = formData.get("parentId") || "root";
    const files = formData
      .getAll("files")
      .filter((file) => file && typeof file.arrayBuffer === "function");

    if (files.length === 0) {
      return Response.json(
        { error: "업로드할 파일을 선택해 주세요." },
        { status: 400 },
      );
    }

    const drive = getDriveClient(accessToken);
    const uploadedFiles = [];

    for (const file of files) {
      const uploadedFile = await uploadDriveFile(drive, parentId, file);
      uploadedFiles.push(uploadedFile);
    }

    return Response.json({ files: uploadedFiles.map(mapDriveFile) });
  } catch (error) {
    console.error("Drive upload error:", error);
    return Response.json(
      { error: getDriveErrorMessage(error) },
      { status: error?.code || 500 },
    );
  }
}
